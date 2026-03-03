import z from "zod";
import getStocksModel from "../../../../models/Stocks.js";
import { ExpressRequest } from "../../../../types/Express.js";
import zodFields from "../../../../zod/Fields.js";
import { getDateRange } from "../../../../func/Date.js";
import getStoreModel from "../../../../models/Store.js";
import mongoose from "mongoose";
const schema = z.object({
  store: z.string().optional(),
  from: zodFields.date,
  to: zodFields.date,
});
const profitAndLoss = async ({ req }: { req: ExpressRequest }) => {
  const Stocks = getStocksModel(req.db!);
  const Store = getStoreModel(req.db!);
  const { store, from, to } = schema.parse(req.query);
  const { starts, ends } = getDateRange({ from, to });
  const TransactionMatches: any = {
    dateObj: { $gte: starts, $lte: ends },
  };
  const matches: any = {};
  if (store) {
    const isStore = await Store.findOne({
      _id: store,
      isDeleted: false,
    });
    if (!isStore) {
      throw new Error("Store not found");
    }
    matches.from = new mongoose.Types.ObjectId(store);
  }

  const stocks = await Stocks.aggregate([
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
              ...TransactionMatches,
              type: "mapengo-stock-sale",
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
      $lookup: {
        from: "stores",
        localField: "from",
        foreignField: "_id",
        as: "shop",
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              type: "item",
            },
          },
        ],
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$shop",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: "$product",
    },
    {
      $addFields: {
        date: "$transaction.date",
        dateObj: "$transaction.dateObj",
        createdAt: "$transaction.createdAt",
        byName: "$transaction.by.name",
        label: "$product.name",
        imgUrl: "$product.imgUrl",
        shop: "$shop.name",
        profit: {
          $subtract: ["$sell", "$cost"],
        },
      },
    },
    {
      $addFields: {
        costs: {
          $multiply: ["$cost", "$quantity"],
        },
        sells: {
          $multiply: ["$sell", "$quantity"],
        },
      },
    },
    {
      $addFields: {
        profits: {
          $subtract: ["$sells", "$costs"],
        },
      },
    },
    {
      $project: {
        transaction: 0,
        product: 0,
      },
    },

    {
      $sort: {
        dateObj: 1,
        createdAt: 1,
      },
    },
  ]);

  return stocks;
};

export default profitAndLoss;
