import { ClientSession, Model } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getTenantModel, { TenantDocument } from "../../../models/Tenant.js";
import {
  addTenant,
  updateTenant,
  moveTenant,
  deleteTenant,
} from "./TenantBox.js";
import mongoose from "mongoose";

type Props = {
  db: string;
  req: ExpressRequest;
  session?: ClientSession;
};

class RealStateManager {
  readonly Model: Model<TenantDocument>;
  readonly req: ExpressRequest;
  readonly session?: ClientSession;
  readonly db: string;

  constructor({ db, req, session }: Props) {
    this.Model = getTenantModel(db);
    this.req = req;
    this.session = session;
    this.db = db;
  }

  async get() {
    const { id, customer, store, floor, no, search }: any = this.req.query;
    const matches: any = {};
    matches.isDeleted = false;

    if (id) matches._id = new mongoose.Types.ObjectId(id as string);
    if (customer)
      matches.customer = new mongoose.Types.ObjectId(customer as string);
    if (store) matches.store = new mongoose.Types.ObjectId(store as string);
    if (floor) matches.floor = Number(floor);
    if (no) matches.no = no;
    // Search logic handled after lookup to include customer fields
    if (search && mongoose.Types.ObjectId.isValid(search)) {
      // If search is a valid ID, we can optionally optimistically match it here if it's a local ID,
      // but simpler to do it all in one place or just add _id here if it's the tenant ID.
      // However, to keep it simple and fix the issue, we remove the restrictive text match here.
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
    ]);

    return id ? data[0] : data;
  }

  async create({ type }: { type: string }) {
    let result;
    switch (type) {
      case "add-tenant":
        result = await addTenant({ req: this.req, session: this.session! });
        break;
      case "update-tenant":
        result = await updateTenant({ req: this.req, session: this.session! });
        break;
      case "move-tenant":
        result = await moveTenant({ req: this.req, session: this.session! });
        break;
      case "delete-tenant":
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
