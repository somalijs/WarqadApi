import mongoose, { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import getTransactionModel from "../../../../models/Transaction.js";
import Generators, { addVersion } from "../../../../func/Generators.js";
import stockAdjustment from "./adjustment.js";
import z from "zod";
import getProductModel from "../../../../models/inventory/Product.js";
import stocklevel from "./stocklevel.js";
import ProductReport from "./ProductReport.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};
const schemaCreate = z.object({
  stockType: z.enum(["adjustment", "sale", "transfer"]),
});
class StockManager {
  req: ExpressRequest;
  session: ClientSession;
  constructor({ req, session }: props) {
    this.req = req;
    this.session = session;
  }

  async create() {
    const { ref } = this.req.query;
    const Transaction = getTransactionModel(this.req.db!);
    let refNo;
    if (ref) {
      const isRef = await Transaction.findOne({
        ref: ref,
        isDeleted: false,
      }).session(this.session!);
      if (!isRef) {
        throw new Error(`Ref ${ref} not found`);
      }
      refNo = addVersion(isRef.ref);
      isRef.isDeleted = true;
      await isRef.save({ session: this.session! });
    } else {
      const refs = await Transaction.distinct("ref");
      refNo = Generators.IdNums({ ids: refs, prefix: "STA", length: 6 });
    }
    const { stockType } = schemaCreate.parse(this.req.query);
    let resCreate;
    switch (stockType) {
      case "adjustment":
        resCreate = await stockAdjustment({
          req: this.req,
          session: this.session!,
          ref: refNo,
        });
        break;
      default:
        throw new Error(`Invalid stock type ${stockType}`);
    }

    return resCreate;
  }
  async get() {
    const { date, type, id } = this.req.query;
    const matches: any = {
      isDeleted: false,
    };
    if (date) {
      matches.date = date;
    }
    if (type) {
      matches.type = type;
    }
    if (id) {
      matches._id = new mongoose.Types.ObjectId(id as string);
    }
    const Products = await getProductModel(this.req.db!).find().lean();
    const Transaction = getTransactionModel(this.req.db!);
    const get = await Transaction.aggregate([
      {
        $match: matches,
      },
      {
        $lookup: {
          from: "stocks",
          localField: "_id",
          foreignField: "transaction",
          pipeline: [
            {
              $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "data",
              },
            },
            {
              $unwind: {
                path: "$data",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                name: "$data.name",
                items: "$data.items",
                type: "$data.type",
                total: {
                  $multiply: ["$quantity", "$cost"],
                },
              },
            },
          ],
          as: "stocks",
        },
      },
    ]);
    const productMap = new Map(Products.map((p: any) => [p._id.toString(), p]));

    const resData = get.map((item: any) => {
      return {
        ...item,
        stocks: item.stocks.map((stock: any) => {
          // If no modification needed, return stock directly
          if (!stock?.data?.items) {
            return stock;
          }

          return {
            ...stock,
            items: stock?.data?.items.map((subItem: any) => ({
              ...subItem,
              here: "tree",
              data: productMap.get(subItem.product.toString()) || null,
            })),
          };
        }),
      };
    });
    if (id && !get.length) {
      throw new Error(`Transaction ${id} not found`);
    }
    return id ? resData[0] : resData;
  }
  async stockLevel() {
    return await stocklevel({ req: this.req });
  }
  async productReport() {
    return await ProductReport({ req: this.req });
  }
}

export default StockManager;
