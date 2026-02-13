import { ClientSession, Model } from "mongoose";
import getProductModel, {
  ProductDocument,
} from "../../../models/inventory/Product.js";
import { ExpressRequest } from "../../../types/Express.js";
import ProductSchema, { itemsSchema } from "./schema.js";
import addLogs from "../../../services/Logs.js";
import mongoose from "mongoose";
import { getProducts } from "./helpers/GetProduct.js";
import {
  deleteImageByUrl,
  updateImageByUrl,
  uploadFile,
} from "../../../services/Files/upload/UploadFile.js";
import { v4 as uuidV4 } from "uuid";

import getInventoryModel from "../../../models/inventory/Inventory.js";
type Props = {
  req: ExpressRequest;
  session?: ClientSession;
};

class ProductManager {
  readonly Model: Model<ProductDocument>;
  readonly req: ExpressRequest;
  readonly session?: ClientSession;

  constructor({ req, session }: Props) {
    this.Model = getProductModel(req.db!);
    this.req = req;
    this.session = session;
  }

  async get() {
    const { id, search, store, type }: any = this.req.query;
    const matches: any = {
      isDeleted: false,
    };

    if (search) {
      const or: any[] = [{ name: { $regex: search, $options: "i" } }];
      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
      matches.$or = or;
    }
    if (type) matches.type = type;

    if (id) matches._id = new mongoose.Types.ObjectId(id);
    if (store) matches.store = new mongoose.Types.ObjectId(store);

    const data = await getProducts({
      matches,
      Model: this.Model,
    });
    let resData = data;

    if (["pressure", "bag"].includes(type)) {
      const items = await getProductModel(this.req.db!).find({
        type: "item",
      });
      resData = resData.map((item: any) => {
        return {
          ...item,
          items: item.items.map((item: any) => {
            return {
              ...item,
              data: items.find(
                (i: any) => String(i._id) === String(item.product),
              ),
            };
          }),
        };
      });
    }
    return id ? resData[0] : resData;
  }

  async add() {
    const body = ProductSchema.parse(this.req.body);
    const { type, category, brand } = body;
    const createData: any = {
      ...body,
      by: this.req.by!,
    };
    if (["pressure", "bag"].includes(type)) {
      const { items } = itemsSchema.parse(this.req.body);
      createData.items = items.map((item: any) => {
        return {
          ...item,
          total: item.quantity * item.cost,
        };
      });
      createData.cost = createData.items.reduce(
        (acc: number, item: any) => acc + item.total,
        0,
      );
    }
    if (category) {
      const isCategory = await getInventoryModel(this.req.db!)
        .findOne({
          _id: category,
          type: "category",
          isDeleted: false,
        })
        .session(this?.session || null);
      if (!isCategory)
        throw new Error(`Category of id (${category}) not found`);
      createData.category = isCategory._id;
    }
    if (brand) {
      const isBrand = await getInventoryModel(this.req.db!)
        .findOne({
          _id: brand,
          type: "brand",
          isDeleted: false,
        })
        .session(this?.session || null);
      if (!isBrand) throw new Error(`Brand of id (${brand}) not found`);
      createData.brand = isBrand._id;
    }
    const files = this.req.files as Express.Multer.File[];

    const created = await this.Model.create([createData], {
      session: this?.session || null,
    });
    if (files && files.length > 0) {
      const upload = await uploadFile({
        file: files[0],
        folder: this.req.db!,
        name: `${body.name}-${created[0]._id}-${uuidV4()}`,
        resize: false,
      });
      if (!upload.ok) throw new Error("Failed to upload image");
      created[0].imgUrl = upload.url;
      await created[0].save({ session: this?.session || null });
    }
    await addLogs({
      model: { type: "product", _id: created[0]._id },
      data: created[0],
      old: {},
      by: this.req.by!,
      dbName: this.req.db!,
      action: "create",
      session: this?.session || null,
    });

    return created[0];
  }

  async update() {
    const { id } = this.req.query;
    if (!id) throw new Error("Product id is required");
    const body = ProductSchema.parse(this.req.body);
    const { category, brand } = body;
    const isExist = await this.Model.findOne({
      _id: id,
      isDeleted: false,
    }).session(this?.session || null);
    if (!isExist) throw new Error(`Product of id (${id}) not found`);

    const oldData: any = {
      name: isExist.name,
      unit: isExist.unit,
      unitQty: isExist.unitQty,
      cost: isExist.cost,
    };

    const newData: any = {
      name: body.name,
      unit: body.unit,
      unitQty: body.unitQty,
      cost: body.cost,
    };
    if (["pressure", "bag"].includes(body.type)) {
      const { items } = itemsSchema.parse(this.req.body);
      newData.items = items.map((item: any) => {
        return {
          ...item,
          total: item.quantity * item.cost,
        };
      });
      newData.cost = newData.items.reduce(
        (acc: number, item: any) => acc + item.total,
        0,
      );
      oldData.items = isExist.items;
    }
    if (category) {
      const isCategory = await getInventoryModel(this.req.db!)
        .findOne({
          _id: category,
          type: "category",
          isDeleted: false,
        })
        .session(this?.session || null);
      if (!isCategory)
        throw new Error(`Category of id (${category}) not found`);
      newData.category = isCategory._id;
      oldData.category = isExist.category;
    }
    if (brand) {
      const isBrand = await getInventoryModel(this.req.db!)
        .findOne({
          _id: brand,
          type: "brand",
          isDeleted: false,
        })
        .session(this?.session || null);
      if (!isBrand) throw new Error(`Brand of id (${brand}) not found`);
      newData.brand = isBrand._id;
      oldData.brand = isExist.brand;
    }
    if (JSON.stringify(oldData) === JSON.stringify(newData)) {
      throw new Error("No changes made");
    }

    const updated = await this.Model.findByIdAndUpdate(
      id,
      { ...newData, by: this.req.by! },
      { session: this.session, new: true, runValidators: true },
    );

    if (!updated) throw new Error(`Error updating product of id (${id})`);

    await addLogs({
      model: { type: "product", _id: updated._id },
      data: updated,
      old: isExist,
      by: this.req.by!,
      dbName: this.req.db!,
      action: "update",
      session: this.session,
    });

    return updated;
  }
  async image() {
    const { id } = this.req.query;
    if (!id) throw new Error("Product id is required");

    const isExist = await this.Model.findOne({
      _id: id,
      isDeleted: false,
    }).session(this?.session || null);
    if (!isExist) throw new Error(`Product of id (${id}) not found`);

    const files = (this.req.files as Express.Multer.File[]) || [];
    if (files.length > 1) {
      throw new Error(`Only one image is allowed`);
    }
    const file = files[0];
    const url = isExist.imgUrl;
    let upload: any;
    if (url && url !== "") {
      upload = await updateImageByUrl({
        file,
        name: `${isExist.name}-${isExist._id}-${uuidV4()}`,
        imageUrl: url,
      });
    } else {
      upload = await uploadFile({
        file,
        folder: this.req.db!,
        name: `${isExist.name}-${isExist._id}-${uuidV4()}`,
      });
    }
    if (!upload.ok) throw new Error("Failed to upload image");
    const updated = await this.Model.findByIdAndUpdate(
      id,
      { imgUrl: upload.url, by: this.req.by! },
      { session: this.session, new: true, runValidators: true },
    );

    if (!updated) throw new Error(`Error updating product of id (${id})`);

    await addLogs({
      model: { type: "product", _id: updated._id },
      data: updated,
      old: isExist,
      by: this.req.by!,
      dbName: this.req.db!,
      action: "update",
      session: this.session,
    });

    return updated;
  }
  async deleteimage() {
    const { id } = this.req.query;
    if (!id) throw new Error("Product id is required");

    const isExist = await this.Model.findOne({
      _id: id,
      isDeleted: false,
    }).session(this?.session || null);
    if (!isExist) throw new Error(`Product of id (${id}) not found`);

    const url = isExist.imgUrl;
    if (!url || url === "") {
      throw new Error(`Product has no image to delete`);
    }
    const deleteImage = await deleteImageByUrl(url);
    if (!deleteImage.ok) throw new Error("Failed to delete image");
    const updated = await this.Model.findByIdAndUpdate(
      id,
      { $unset: { imgUrl: "" }, by: this.req.by! },
      { session: this.session, new: true, runValidators: true },
    );

    if (!updated) throw new Error(`Error updating product of id (${id})`);

    await addLogs({
      model: { type: "product", _id: updated._id },
      data: updated,
      old: isExist,
      by: this.req.by!,
      dbName: this.req.db!,
      action: "update",
      session: this.session,
    });

    return updated;
  }
  async delete() {
    const { id } = this.req.query;
    if (!id) throw new Error("Product id is required");
    const isExist = await this.Model.findById(id).session(
      this?.session || null,
    );
    if (!isExist) throw new Error(`Product of id (${id}) not found`);
    if (isExist.isDeleted) throw new Error(`Product is already deleted`);

    const deleted = await this.Model.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { session: this?.session || null, new: true },
    );

    if (!deleted) throw new Error(`Error deleting product of id (${id})`);

    await addLogs({
      model: { type: "product", _id: deleted._id },
      data: deleted,
      old: isExist,
      by: this.req.by!,
      dbName: this.req.db!,
      action: "delete",
      session: this.session,
    });

    return deleted;
  }
}

export default ProductManager;
