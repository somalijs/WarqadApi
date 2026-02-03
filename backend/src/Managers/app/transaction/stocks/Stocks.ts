import mongoose from "mongoose";
import getProductModel from "../../../../models/inventory/Product.js";
import { ExpressRequest } from "../../../../types/Express.js";
import getStocksModel from "../../../../models/Stocks.js";
import { getDateRange } from "../../../../func/Date.js";

type StockManagerProps = {
  req: ExpressRequest;
};

class StockManager {
  readonly req: ExpressRequest;
  constructor({ req }: StockManagerProps) {
    this.req = req;
  }

  async stockLevels() {
    const req = this.req;
    const { id, store } = req.query;
    const Product = getProductModel(req.db!);
    const matches: any = {
      isDeleted: false,
      store: new mongoose.Types.ObjectId(store as string),
    };
    if (id) {
      matches._id = new mongoose.Types.ObjectId(id as string);
    }
    const get = await Product.aggregate([
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
                as: "transactions",
              },
            },
            {
              $unwind: "$transactions",
            },
            {
              $addFields: {
                calculatedQuantity: {
                  $cond: [
                    {
                      $eq: ["$transactions.type", "purchase"],
                    },
                    "$quantity",
                    {
                      $multiply: ["$quantity", -1],
                    },
                  ],
                },
                label: "$transactions.type",
                ref: "$transactions.ref",
                type: "$transactions.type",
                date: "$transactions.date",
                dateObj: "$transactions.dateObj",
                createdAt: "$transactions.createdAt",
              },
            },
            {
              $project: {
                transactions: 0,
              },
            },
            {
              $sort: {
                dateObj: 1,
                createdAt: 1,
              },
            },
          ],
          as: "stock",
        },
      },

      {
        $addFields: {
          available: {
            $sum: "$stock.calculatedQuantity",
          },
        },
      },
    ]);
    return id ? get[0] : get;
  }
  async profitAndLoss() {
    const req = this.req;
    const { store, from, to } = req.query;
    if (!store) {
      throw new Error("Store is required");
    }
    if (!from || !to) {
      throw new Error("From and to Dates are required");
    }
    const { starts, ends } = getDateRange({
      from: from as string,
      to: to as string,
    });
    const Stock = getStocksModel(req.db!);
    const transactionMatches: any = {
      isDeleted: false,
      type: "sale",
      store: new mongoose.Types.ObjectId(store as string),
    };

    transactionMatches.dateObj = { $gte: starts, $lte: ends };

    const get = await Stock.aggregate([
      {
        $lookup: {
          from: "transactions",
          localField: "transaction",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                ...transactionMatches,
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
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          productName: "$product.name",
          productImage: "$product.imgUrl",
          unit: "$product.unit",
          unitQty: "$product.unitQty",
          cost: "$cost",
          sell: "$sell",
          quantity: "$quantity",
          profit: {
            $subtract: ["$sell", "$cost"],
          },
          ref: "$transaction.ref",
          type: "$transaction.type",
          label: {
            $cond: [
              {
                $eq: ["$transaction.profile", "customer"],
              },
              {
                $concat: ["Customer:", " ", "$customer.name"],
              },
              {
                $concat: ["Shop:", " ", "$shop.name"],
              },
            ],
          },
          date: "$transaction.date",
          dateObj: "$transaction.dateObj",
          createdAt: "$transaction.createdAt",
        },
      },
      {
        $sort: {
          dateObj: 1,
          createdAt: 1,
        },
      },
      {
        $project: {
          _id: 1,
          productName: 1,
          productImage: 1,
          unit: 1,
          unitQty: 1,
          cost: 1,
          sell: 1,
          quantity: 1,
          profit: 1,
          date: 1,
          dateObj: 1,
          createdAt: 1,
          label: 1,
          ref: 1,
          type: 1,
        },
      },
    ]);
    return get;
  }
}

export default StockManager;
