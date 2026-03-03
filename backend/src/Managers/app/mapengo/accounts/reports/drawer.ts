import getDrawerModel from "../../../../../models/drawers.js";
import { ExpressRequest } from "../../../../../types/Express.js";

const mapengoDrawer = async ({
  matches,
  req,
}: {
  matches: any;
  req: ExpressRequest;
}) => {
  const Model = getDrawerModel(req.db!);
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
                  { $eq: ["$$accountId", "$from._id"] },
                  { $eq: ["$$accountId", "$to._id"] },
                ],
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
                      case: { $eq: ["$to._id", "$$accountId"] },
                      then: "$amount",
                    },
                    {
                      case: { $eq: ["$from._id", "$$accountId"] },
                      then: { $multiply: ["$amount", -1] },
                    },
                  ],
                  default: 0,
                },
              },
              action: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$to._id", "$$accountId"] },
                      then: "credit",
                    },
                    {
                      case: { $eq: ["$from._id", "$$accountId"] },
                      then: "debit",
                    },
                  ],
                  default: "",
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
export default mapengoDrawer;
