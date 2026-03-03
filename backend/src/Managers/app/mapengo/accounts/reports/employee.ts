import getAccountModel from "../../../../../models/Acounts.js";
import { ExpressRequest } from "../../../../../types/Express.js";

const mapengoEmployee = async ({
  matches,
  req,
}: {
  matches: any;
  req: ExpressRequest;
}) => {
  const Model = getAccountModel(req.db!);
  matches.profile = "employee";
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
                $eq: ["$$accountId", "$employee._id"],
              },
            },
          },
          {
            $addFields: {
              label: "$details.description",

              originalAmount: "$amount",
              originalCurrency: "$currency",
              amount: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$$accountCurrency", "$currency"] },
                      then: "$amount",
                    },
                  ],
                  default: "$exchangedAmount",
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
export default mapengoEmployee;
