import { Model } from "mongoose";

import { AccountDocument } from "../../../../models/Acounts.js";

export async function getAccounts({
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
    transactionMatches["currency"] = currency;
  }

  const data = await Model.aggregate([
    {
      $match: matches,
    },
    {
      $lookup: {
        from: "transactions",
        let: { accountId: "$_id" },
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
                  { $eq: ["$$accountId", "$broker._id"] },
                ],
              },
            },
          },
          {
            $addFields: {
              amount: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $and: [
                          { $eq: [profile, "broker"] },
                          {
                            $eq: ["$adjustmentType", "customer-broker-invoice"],
                          },
                        ],
                      },
                      then: "$commission",
                    },
                  ],
                  default: "$amount",
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
                      case: { $eq: ["$type", "adjustment"] },
                      then: {
                        $concat: [
                          {
                            $cond: {
                              if: { $eq: [profile, "broker"] },
                              then: "Commission - ",
                              else: "",
                            },
                          },
                          { $ifNull: ["$details.description", ""] },
                          " (",
                          { $ifNull: ["$details.houseNo", ""] },
                          ")",
                        ],
                      },
                    },
                    {
                      case: { $eq: ["$type", "payment"] },
                      then: {
                        $concat: [
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
                  ],
                  default: {
                    $ifNull: ["$details.description", "$amount"],
                  },
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

        currency: { $ifNull: [currency, null] },
        name: {
          $cond: {
            if: { $ne: [currency, null] },
            then: { $concat: ["$name", " (", currency, ")"] },
            else: "$name",
          },
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
