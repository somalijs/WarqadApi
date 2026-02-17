import { Model } from "mongoose";

import { AccountDocument } from "../../../../models/Acounts.js";

export async function getKaramaAccounts({
  matches,
  Model,
  transactionMatches,
  profile,
  currency,
}: {
  matches: any;
  Model: Model<AccountDocument>;
  transactionMatches?: any;
  profile?: string;
  currency?: string;
}) {
  if (currency) {
    matches["currency"] = currency;
  }

  const data = await Model.aggregate([
    {
      $match: matches,
    },
    {
      $lookup: {
        from: "transactions",
        let: { accountId: "$_id", accountCurrency: "$currency" },
        pipeline: [
          {
            $match: {
              ...transactionMatches,
              isDeleted: false,
              $expr: {
                $or: [
                  {
                    $eq: [
                      "$$accountId",
                      {
                        $getField: {
                          field: "_id",
                          input: {
                            $getField: { field: profile, input: "$$ROOT" },
                          },
                        },
                      },
                    ],
                  },
                  {
                    $eq: ["$$accountId", "$sarif._id"],
                  },
                ],
              },
            },
          },
          {
            $addFields: {
              originalAmount: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$$accountId", "$sarif._id"] },
                      then: "$exchangedAmount",
                    },
                  ],
                  default: "$amount",
                },
              },
              originalCurrency: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$$accountId", "$sarif._id"] },
                      then: "$exchangedCurrency",
                    },
                  ],
                  default: "$currency",
                },
              },
              amount: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$$accountId", "$sarif._id"] },
                      then: "$sarifAmount",
                    },
                    {
                      case: { $ne: ["$currency", "$$accountCurrency"] },
                      then: "$exchangedAmount",
                    },
                  ],
                  default: "$amount",
                },
              },
              action: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$$accountId", "$sarif._id"] },
                      then: "credit",
                    },
                  ],
                  default: "$action",
                },
              },
            },
          },
          {
            $addFields: {
              calculatedAmount: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$action", "debit"] },
                      then: { $multiply: ["$amount", -1] },
                    },
                    {
                      case: { $eq: ["$action", "credit"] },
                      then: "$amount",
                    },
                  ],
                  default: "$amount",
                },
              },
              label: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$type", "invoice-list"] },
                      then: "Invoice",
                    },
                    {
                      case: { $eq: ["$type", "journal"] },
                      then: {
                        $ifNull: ["$details.description", "Unknown Journal"],
                      },
                    },
                    {
                      case: { $in: ["$type", ["sale", "purchase", "payment"]] },
                      then: {
                        $ifNull: [
                          "$details.description",
                          "Unknown Transaction",
                        ],
                      },
                    },
                  ],
                  default: "$amount",
                },
              },
              currency: "$$accountCurrency",
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

        name: {
          $concat: [
            "$name",
            " (",
            {
              $ifNull: ["$currency", ""],
            },
            ")",
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
        storeName: "$storeData.name",
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
