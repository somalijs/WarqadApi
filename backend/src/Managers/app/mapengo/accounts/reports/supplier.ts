import getAccountModel from "../../../../../models/Acounts.js";
import { ExpressRequest } from "../../../../../types/Express.js";

const mapengoSupplier = async ({
  matches,
  req,
}: {
  matches: any;
  req: ExpressRequest;
}) => {
  const Model = getAccountModel(req.db!);
  matches.profile = "supplier";
  const result = await Model.aggregate([
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
              isDeleted: false,
              $expr: {
                $or: [
                  {
                    $eq: ["$$accountId", "$supplier._id"],
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
              label: "$details.description",
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
              currency: "$$accountCurrency",
            },
          },
          {
            $addFields: {
              calculatedAmount: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$action", "credit"] },
                      then: "$amount",
                    },
                    {
                      case: { $eq: ["$action", "debit"] },
                      then: { $multiply: ["$amount", -1] },
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
        ],

        as: "transactions",
      },
    },
    {
      $addFields: {
        originalName: "$name",
        name: {
          $concat: ["$name", " (", "$currency", ")"],
        },
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
  return result;
};
export default mapengoSupplier;
