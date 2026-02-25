import z from "zod";
import { ExpressRequest } from "../../../../types/Express.js";
import mongoose from "mongoose";
import getStoreModel from "../../../../models/Store.js";
import getProductModel from "../../../../models/inventory/Product.js";
import getStocksModel from "../../../../models/Stocks.js";

const ProductReport = async ({ req }: { req: ExpressRequest }) => {
  const schema = z.object({
    id: z.string(),
    type: z.enum(["item", "bag", "pressure"]),
    store: z.string().optional(),
  });
  const Store = getStoreModel(req.db!);
  const Product = getProductModel(req.db!);
  const Stocks = getStocksModel(req.db!);
  const { id, type, store } = schema.parse(req.query);

  const matches: any = {};
  if (store) {
    const isStore = await Store.findOne({
      _id: store,
      isDeleted: false,
    });
    if (!isStore) {
      throw new Error("Store not found");
    }
    matches["$or"] = [
      {
        from: new mongoose.Types.ObjectId(store),
      },
      {
        to: new mongoose.Types.ObjectId(store),
      },
    ];
  }
  const isItem = await Product.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!isItem) {
    throw new Error("Item not found");
  }
  matches.product = new mongoose.Types.ObjectId(id);
  const datas = await Stocks.aggregate([
    {
      $match: matches,
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
              stockType: type,
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
        date: "$transaction.date",
        dateObj: "$transaction.dateObj",
        createdAt: "$transaction.createdAt",
        label: "$transaction.details.description",
        action: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$transaction.type", "mapengo-sale"] },
                then: "debit",
              },
              {
                case: {
                  $eq: ["$transaction.type", "mapengo-stock-adjustment"],
                },
                then: "$transaction.action",
              },
              {
                case: { $eq: ["$transaction.type", "mapengo-stock-transfer"] },
                then: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $ne: ["$type", "item"],
                        },
                        then: {
                          $switch: {
                            branches: [
                              {
                                case: {
                                  $in: [
                                    "$transaction.stockTransferType",
                                    ["pressure to item", "bag to item"],
                                  ],
                                },
                                then: "debit",
                              },
                            ],
                            default: "none",
                          },
                        },
                      },
                      {
                        case: {
                          $in: [
                            "$transaction.stockTransferType",
                            ["pressure to item", "bag to item"],
                          ],
                        },
                        then: "credit",
                      },
                      {
                        case: { $ne: [store, null] },
                        then: {
                          $cond: {
                            if: {
                              $eq: ["$to", new mongoose.Types.ObjectId(store)],
                            },
                            then: "credit",
                            else: "debit",
                          },
                        },
                      },
                    ],
                    default: "none",
                  },
                },
              },
            ],
            default: "none",
          },
        },
      },
    },
    {
      $addFields: {
        calculatedQuantity: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$action", "debit"] },
                then: {
                  $multiply: ["$quantity", -1],
                },
              },
              {
                case: { $eq: ["$action", "credit"] },
                then: "$quantity",
              },
            ],
            default: 0,
          },
        },
      },
    },

    {
      $sort: {
        dateObj: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!datas || datas.length === 0) {
    throw new Error("No data found for this item/bag");
  }
  return datas;
};

export default ProductReport;
