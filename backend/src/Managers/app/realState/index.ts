import { ClientSession, Model } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getUnitModel, { UnitDocument } from "../../../models/Unit.js";
import {
  addTenant,
  updateTenant,
  moveTenant,
  deleteTenant,
} from "./TenantBox.js";
import mongoose from "mongoose";
import { getEndDate } from "../../../func/Date.js";

type Props = {
  db: string;
  req: ExpressRequest;
  session?: ClientSession;
};

class RealStateManager {
  readonly Model: Model<UnitDocument>;
  readonly req: ExpressRequest;
  readonly session?: ClientSession;
  readonly db: string;

  constructor({ db, req, session }: Props) {
    this.Model = getUnitModel(db);
    this.req = req;
    this.session = session;
    this.db = db;
  }

  async get() {
    const { id, customer, store, floor, no, search, profile, date }: any =
      this.req.query;

    const matches: any = {};
    matches.isDeleted = false;
    if (profile) matches.profile = profile;
    if (id) matches._id = new mongoose.Types.ObjectId(id as string);
    if (customer)
      matches.customer = new mongoose.Types.ObjectId(customer as string);
    if (store) matches.store = new mongoose.Types.ObjectId(store as string);
    if (floor) matches.floor = Number(floor);
    if (no) matches.no = no;
    const transactionMatches: any = {};
    if (date) {
      const ends = getEndDate(date);

      transactionMatches.dateObj = { $lte: ends };
    }

    // Search logic handled after lookup to include customer fields
    if (search) {
      const or: any[] = [{ name: { $regex: search, $options: "i" } }];

      if (mongoose.Types.ObjectId.isValid(search)) {
        or.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      matches.$or = or;
    }
    const data = await this.Model.aggregate([
      { $match: matches },
      {
        $lookup: {
          from: "accounts",
          localField: "customer",
          foreignField: "_id",
          as: "customerObj",
        },
      },
      {
        $unwind: "$customerObj",
      },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "customerObj.name": { $regex: search, $options: "i" } },
                  {
                    "customerObj.phoneNumber": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  { no: { $regex: search, $options: "i" } },
                  ...(mongoose.Types.ObjectId.isValid(search)
                    ? [{ _id: new mongoose.Types.ObjectId(search) }]
                    : []),
                ],
              },
            },
          ]
        : []),

      {
        $lookup: {
          from: "stores",
          localField: "store",
          foreignField: "_id",
          as: "storeObj",
        },
      },
      {
        $unwind: {
          path: "$storeObj",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          customerName: "$customerObj.name",
          name: {
            $concat: [
              "floor ",
              { $toString: "$floor" },
              " - ",
              "no ",
              { $toString: "$no" },
              " (",
              "$customerObj.name",
              ")",
            ],
          },
          storeName: "$storeObj.name",
          status: {
            $cond: [
              { $ifNull: ["$endDate", false] }, // if endDate exists (not null)
              "Moved",
              "Active",
            ],
          },
        },
      },
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          let: { accountCurrency: "$currency" },
          foreignField: "unit",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                ...transactionMatches,
              },
            },
            {
              $addFields: {
                originalAmount: "$amount",
                originalCurrency: "$currency",
                amount: {
                  $cond: [
                    { $ne: ["$$accountCurrency", "$currency"] },
                    "$exchangedAmount",
                    "$amount",
                  ],
                },
              },
            },
            {
              $addFields: {
                debits: {
                  $cond: [{ $eq: ["$action", "debit"] }, "$amount", 0],
                },
                credits: {
                  $cond: [{ $eq: ["$action", "credit"] }, "$amount", 0],
                },
                label: "$details.description",
                calculatedAmount: {
                  $cond: [
                    { $eq: ["$action", "debit"] },
                    { $multiply: ["$amount", -1] },
                    "$amount",
                  ],
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
          balance: {
            $sum: "$transactions.calculatedAmount",
          },
          debits: {
            $sum: "$transactions.debits",
          },
          credits: {
            $sum: "$transactions.credits",
          },
        },
      },
    ]);

    return id ? data[0] : data;
  }

  async create({ type }: { type: string }) {
    let result;
    switch (type) {
      case "add-unit":
        result = await addTenant({ req: this.req, session: this.session! });
        break;
      case "update-unit":
        result = await updateTenant({ req: this.req, session: this.session! });
        break;
      case "move-unit":
        result = await moveTenant({ req: this.req, session: this.session! });
        break;
      case "delete-unit":
        result = await deleteTenant({ req: this.req, session: this.session! });
        break;
      default:
        throw new Error("Invalid real state type");
    }
    return {
      message: `${type} successfully`,
      data: result,
    };
  }
}

export default RealStateManager;
