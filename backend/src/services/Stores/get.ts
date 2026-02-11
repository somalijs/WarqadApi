import mongoose from "mongoose";
import { ExpressRequest } from "../../types/Express.js";
import getStoreModel from "../../models/Store.js";

// Returns list or single store when query.id is provided
const getStores = async ({
  req,
  dbName,
  matches,
}: {
  req: ExpressRequest;
  dbName: string;
  matches?: Record<string, unknown>;
}) => {
  const { id, type, select, query, search } = req.query as {
    id?: string;
    type?: string;
    app?: string;
    select?: string;
    query?: string;
    search?: string;
  };

  const match: Record<string, unknown> = {
    ...matches,
  };
  if (id) match._id = new mongoose.Types.ObjectId(id);
  if (type) match.type = type;

  if (query) {
    match.name = { $regex: query.toLowerCase(), $options: "i" };
  }
  if (search) {
    const or: any[] = [{ name: { $regex: search, $options: "i" } }];

    if (mongoose.Types.ObjectId.isValid(search)) {
      or.push({ _id: new mongoose.Types.ObjectId(search) });
    }

    match.$or = or;
  }
  if (id && req.role !== "admin") {
    const storeIds = req.storeIds || [];
    if (!storeIds.includes(id)) {
      throw new Error("You are not authorized to access this store");
    }
  }
  const Model = getStoreModel(dbName);
  const find = await Model.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "apps",
        localField: "app",
        foreignField: "_id",
        as: "apps",
      },
    },
    { $unwind: { path: "$apps", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        appName: "$apps.name",
      },
    },
    { $project: { apps: 0 } },
    {
      $addFields: {
        status: {
          $cond: {
            if: { $eq: ["$isActive", true] },
            then: "active",
            else: "inactive",
          },
        },
      },
    },
  ]);

  let resData: any = find;
  if (select) {
    resData = resData.map((item: any) => ({
      label: `${item.name} `,
      value: item._id,
      status: item.status,
      type: item.type,
    }));
  }
  if (id && !resData.length) {
    throw new Error("Store not found");
  }

  return id ? resData[0] : resData;
};

export default getStores;
