import { Model } from "mongoose";
import { DrawerDocument } from "../../../../models/drawers.js";

export async function getDrawers({
  matches,
  Model,
  transactionMatches = [],
}: {
  matches: any;
  transactionMatches?: any;
  Model: Model<DrawerDocument>;
}) {
  const data = await Model.aggregate([
    {
      $match: matches,
    },
    {
      $addFields: {
        name: {
          $concat: ["$name", " (", "$currency", ")"],
        },
      },
    },
    {
      $lookup: {
        from: "transactions",
        let: { drawerId: "$_id", drawerCurrency: "$currency" },
        pipeline: [
          {
            $match: {
              isDeleted: false,
              ...transactionMatches,
              $expr: {
                $or: [
                  { $eq: ["$from._id", "$$drawerId"] },
                  { $eq: ["$to._id", "$$drawerId"] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "stores",
              localField: "store",
              foreignField: "_id",
              as: "storeData",
            },
          },
          {
            $unwind: {
              path: "$storeData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              originalAmount: "$amount",
              amount: {
                $cond: {
                  if: { $ne: ["$currency", "$$drawerCurrency"] },
                  then: { $ifNull: ["$exchangedAmount", 0] },
                  else: "$amount",
                },
              },
            },
          },
          {
            $addFields: {
              calculatedAmount: {
                $cond: {
                  if: { $eq: ["$from._id", "$$drawerId"] },
                  then: { $multiply: ["$amount", -1] },
                  else: "$amount",
                },
              },
              label: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$type", "payment"] },
                      then: {
                        $concat: [
                          "$profile",
                          " ",
                          "payment",
                          " ",
                          {
                            $cond: {
                              if: {
                                $or: [
                                  {
                                    $and: [
                                      { $eq: ["$action", "debit"] },
                                      { $eq: ["$profile", "customer"] },
                                    ],
                                  },
                                  {
                                    $and: [
                                      { $eq: ["$action", "credit"] },
                                      { $ne: ["$profile", "customer"] },
                                    ],
                                  },
                                ],
                              },
                              then: "(received)",
                              else: "(Paid)",
                            },
                          },
                          " - ",
                          { $ifNull: ["$note", ""] },
                        ],
                      },
                    },
                    {
                      case: { $eq: ["$type", "money-transfer"] },
                      then: {
                        $concat: [
                          "Money Transfer from (",
                          {
                            $ifNull: ["$from.name", "Unknown"],
                          },
                          ") to (",
                          {
                            $ifNull: ["$to.name", "Unknown"],
                          },
                          ")",
                        ],
                      },
                    },
                    {
                      case: { $eq: ["$type", "expenses"] },
                      then: {
                        $concat: ["Expenses - ", "$details.description"],
                      },
                    },
                    {
                      case: { $eq: ["$type", "adjustment"] },
                      then: "$details.description",
                    },
                    {
                      case: { $eq: ["$houseInvoice", "rent"] },
                      then: {
                        $concat: [
                          "$storeData.name",
                          " - ",
                          "$details.description",
                        ],
                      },
                    },
                  ],
                  default: {
                    $ifNull: ["$details.description", "Transaction Unknown"],
                  },
                },
              },
              line: {
                $cond: {
                  if: { $eq: ["$from._id", "$$drawerId"] },
                  then: "debit",
                  else: "credit",
                },
              },
              action: {
                $cond: {
                  if: { $eq: ["$from._id", "$$drawerId"] },
                  then: "debit",
                  else: "credit",
                },
              },
              currency: "$$drawerCurrency",
            },
          },
          {
            $sort: {
              dateObj: 1,
              createdAt: 1,
            },
          },
        ],
        as: "transactions",
      },
    },
    {
      $addFields: {
        balance: { $sum: "$transactions.calculatedAmount" },
        credit: {
          $reduce: {
            input: "$transactions",
            initialValue: 0,
            in: {
              $cond: [
                { $gte: ["$$this.calculatedAmount", 0] },
                { $add: ["$$value", "$$this.calculatedAmount"] },
                "$$value",
              ],
            },
          },
        },
        debit: {
          $reduce: {
            input: "$transactions",
            initialValue: 0,
            in: {
              $cond: [
                { $lt: ["$$this.calculatedAmount", 0] },
                { $add: ["$$value", "$$this.calculatedAmount"] },
                "$$value",
              ],
            },
          },
        },
      },
    },
    {
      $sort: {
        name: 1,
      },
    },
  ]);
  return data;
}
