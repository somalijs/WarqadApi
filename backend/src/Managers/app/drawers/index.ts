import { ClientSession, Model } from "mongoose";

import { ExpressRequest } from "../../../types/Express.js";
import AccountSchema from "./schema.js";
import addLogs from "../../../services/Logs.js";
import getStoreModel from "../../../models/Store.js";
import mongoose from "mongoose";
import getDrawerModel, { DrawerDocument } from "../../../models/drawers.js";
import { getDateRange } from "../../../func/Date.js";
import { getDrawers } from "./helpers/getAccounts.js";

type Props = {
  db: string;
  req: ExpressRequest;
  session?: ClientSession;
};

class DrawerManager {
  readonly Model: Model<DrawerDocument>;
  readonly req: ExpressRequest;
  readonly session?: ClientSession;
  readonly db: string;

  constructor({ db, req, session }: Props) {
    this.Model = getDrawerModel(db);
    this.req = req;
    this.session = session;
    this.db = db;
  }
  async get() {
    const { id, type, select, store, currency, from, to }: any = this.req.query;
    const matches: any = {
      isDeleted: false,
    };

    if (id) matches._id = new mongoose.Types.ObjectId(id!);
    if (type) matches.type = type;
    if (store) matches.store = new mongoose.Types.ObjectId(store!);
    if (currency) matches.currency = currency;
    if (this.req?.role !== "admin") {
      matches.store = {
        $in: (this.req?.storeIds || []).map(
          (item) => new mongoose.Types.ObjectId(item)
        ),
      };
    }
    const transactionMatches: any = {};
    if (from && to) {
      const { starts, ends } = getDateRange({ from, to });
      transactionMatches.dateObj = { $gte: starts, $lte: ends };
    }
    const data = await this.Model.aggregate([
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
                    ],
                    default: "Transaction Unknown",
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
    let result = data;
    if (select) {
      result = data.map((item) => {
        return {
          value: item._id,
          label: item.name + ` (${item.currency})`,
          type: item.type,
          currency: item.currency,
          balance: item.balance || 0,
        };
      });
    }

    return {
      data: id ? result[0] : result,
      title: id ? result[0].name : "All Drawers",
    };
  }
  async add() {
    const base = AccountSchema.base.parse(this.req.body);

    // reject if its not admin and store is no includes req.storeids
    if (this.req?.role !== "admin") {
      if ((this.req?.storeIds || []).includes(String(base.store)))
        throw new Error("You are not authorized For this Store");
    }
    const createData = {
      ...base,
    };
    // check if store exists
    const store = await getStoreModel(this.db)
      .findById(createData.store)
      .session(this?.session || null);
    if (!store) throw new Error(`Store of id (${createData.store}) not found`);
    const created = await this.Model.create(
      [{ ...createData, by: this.req.by! }],
      { session: this?.session || null }
    );

    // add logs
    await addLogs({
      model: { type: "drawer", _id: created[0]._id },
      data: created[0],
      old: {},
      by: this.req.by!,
      dbName: this.db,
      action: "create",
      session: this?.session || null,
    });
    return created[0];
  }

  async update() {
    const { id } = this.req.params;
    const rawBody = this.req.body;

    // validate base
    const base = AccountSchema.base.parse(rawBody);
    // reject if its not admin and store is no includes req.storeids
    if (this.req?.role !== "admin") {
      if ((this.req?.storeIds || []).includes(String(base.store)))
        throw new Error("You are not authorized For this Store");
    }

    // check if account exists
    const isExist = await this.Model.findById(id).session(
      this?.session || null
    );
    if (!isExist) throw new Error(`${base.type} of id (${id}) not found`);

    // create oldData
    const oldData: Record<string, any> = {
      name: isExist.name,
      type: isExist.type,
      description: isExist.description,
      restricted: isExist.restricted,
      currency: isExist.currency,
    };

    // create newData
    const newData: Record<string, any> = {
      name: base.name,
      type: base.type,
      description: base.description,
      restricted: base.restricted,
      currency: base.currency,
    };

    // check if data changed
    if (JSON.stringify(oldData) === JSON.stringify(newData)) {
      throw new Error("No changes made");
    }
    newData.store = isExist.store;
    // replace the document
    const updated = await this.Model.findOneAndReplace(
      { _id: isExist._id },
      { ...newData, by: this.req.by! },
      { session: this.session, new: true, runValidators: true }
    );

    if (!updated) throw new Error(`Error updating ${base.type} of id (${id})`);

    // add logs
    await addLogs({
      model: { type: "drawer", _id: updated._id },
      data: updated,
      old: isExist,
      by: this.req.by!,
      dbName: this.db,
      action: "update",
      session: this.session,
    });

    return updated;
  }

  async delete() {
    const { id } = this.req.params;
    if (this.req.role !== "admin") {
      throw new Error("Only Admins Can Delete Drawer");
    }
    const isExist = await this.Model.findOne({
      _id: id,
    }).session(this?.session || null);
    if (!isExist) throw new Error(`Drawer of id (${id}) not found`);

    //
    const account = await getDrawers({
      Model: this.Model,
      matches: {
        _id: new mongoose.Types.ObjectId(id),
      },
    });
    const balance = account[0]?.balance || 0;

    if (balance !== 0) throw new Error(`Drawer has balance  (${balance})`);
    // else delete
    const deleted = await this.Model.findOneAndUpdate(
      { _id: id },
      {
        isDeleted: true,
      },
      { session: this?.session || null, new: true }
    );
    if (!deleted) throw new Error(`Error deleting drawer of id (${id})`);

    // add logs
    await addLogs({
      model: { type: "drawer", _id: deleted._id },
      data: deleted,
      old: isExist,
      by: this.req.by!,
      dbName: this.db,
      action: "delete",
      session: this.session,
    });

    return deleted;
  }
}

export default DrawerManager;
