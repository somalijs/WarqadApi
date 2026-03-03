import z from "zod";

import { ExpressRequest } from "../../../../types/Express.js";
import zodFields from "../../../../zod/Fields.js";
import getProductModel from "../../../../models/inventory/Product.js";
import mongoose from "mongoose";

const stockBalance = async ({ req }: { req: ExpressRequest }) => {
  const typeSchema = z.object({
    type: z.enum(["item", "bag", "pressure"]),
    store: zodFields.objectId("store id"),
    id: zodFields.objectId("product ").optional(),
  });
  const Product = getProductModel(req.db!);

  const { type, store, id } = typeSchema.parse(req.query);
  const matches: any = {
    type,
    isDeleted: false,
  };
  if (id) {
    matches._id = new mongoose.Types.ObjectId(id);
  }
  const stockMatches: any = {};
  const storeId = new mongoose.Types.ObjectId(store);
  if (store) {
    stockMatches.$or = [{ from: storeId }, { to: storeId }];
  }
  const result = await Product.aggregate([
    {
      $match: matches,
    },
    {
      $lookup: {
        from: "stocks",
        localField: "_id",
        foreignField: "product",
        pipeline: [
          {
            $match: stockMatches,
          },
          {
            $lookup: {
              from: "transactions",
              localField: "transaction",
              foreignField: "_id",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                  },
                },
              ],
              as: "transaction",
            },
          },
          {
            $unwind: "$transaction",
          },
          {
            $addFields: {
              calculatedQuantity: {
                $cond: {
                  if: {
                    $eq: ["$to", storeId],
                  },
                  then: "$quantity",
                  else: {
                    $multiply: ["$quantity", -1],
                  },
                },
              },
            },
          },
        ],
        as: "stocks",
      },
    },
    {
      $addFields: {
        balance: { $sum: "$stocks.calculatedQuantity" },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        imgUrl: 1,
        balance: 1,
        stocks: 1,
      },
    },
  ]);
  if (!result.length) {
    throw new Error("Product not found");
  }
  return id ? result[0] : result;
};

export default stockBalance;
