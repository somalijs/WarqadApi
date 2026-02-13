import { ClientSession, Model } from "mongoose";
import getInventoryModel, {
  InventoryDocument,
} from "../../../models/inventory/Inventory.js";
import { ExpressRequest } from "../../../types/Express.js";
import { inventorySchema } from "./schema.js";
import addLogs from "../../../services/Logs.js";
import mongoose from "mongoose";

type Props = {
  req: ExpressRequest;
  session?: ClientSession;
};

class InventoryManager {
  readonly Model: Model<InventoryDocument>;
  readonly req: ExpressRequest;
  readonly session?: ClientSession;

  constructor({ req, session }: Props) {
    this.Model = getInventoryModel(req.db!);
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

    const data = await this.Model.find(matches).sort({ createdAt: -1 });

    return id ? data[0] : data;
  }

  async add() {
    const body = inventorySchema.parse(this.req.body);
    const createData: any = {
      ...body,
      by: this.req.by!,
    };

    const created = await this.Model.create([createData], {
      session: this?.session || null,
    });

    await addLogs({
      model: { type: "inventory" as any, _id: created[0]._id },
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
    if (!id) throw new Error("Inventory id is required");
    const body = inventorySchema.parse(this.req.body);

    const isExist = await this.Model.findOne({
      _id: id,
      isDeleted: false,
    }).session(this?.session || null);
    if (!isExist) throw new Error(`Inventory of id (${id}) not found`);

    const oldData: any = {
      name: isExist.name,
      type: isExist.type,
      store: isExist.store?.toString(),
    };

    const newData: any = {
      name: body.name,
      type: body.type,
      store: body.store,
    };

    if (JSON.stringify(oldData) === JSON.stringify(newData)) {
      throw new Error("No changes made");
    }

    const updated = await this.Model.findByIdAndUpdate(
      id,
      { ...newData },
      { session: this.session, new: true, runValidators: true },
    );

    if (!updated) throw new Error(`Error updating inventory of id (${id})`);

    await addLogs({
      model: { type: "inventory" as any, _id: updated._id },
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
    if (!id) throw new Error("Inventory id is required");
    const isExist = await this.Model.findById(id).session(
      this?.session || null,
    );
    if (!isExist) throw new Error(`Inventory of id (${id}) not found`);
    if (isExist.isDeleted) throw new Error(`Inventory is already deleted`);

    const deleted = await this.Model.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { session: this?.session || null, new: true },
    );

    if (!deleted) throw new Error(`Error deleting inventory of id (${id})`);

    await addLogs({
      model: { type: "inventory" as any, _id: deleted._id },
      data: deleted,
      old: isExist,
      by: this.req.by!,
      dbName: this.req.db!,
      action: "delete",
      session: this.session,
    });

    return deleted;
  }
  async image() {
    return "no image";
  }
  async deleteimage() {
    return "no image";
  }
}

export default InventoryManager;
