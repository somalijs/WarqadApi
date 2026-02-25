import z from "zod";

import { ExpressRequest } from "../../../../types/Express.js";
import zodFields from "../../../../zod/Fields.js";
import getProductModel from "../../../../models/inventory/Product.js";
import mongoose from "mongoose";
import getStoreModel from "../../../../models/Store.js";
import getStocksModel from "../../../../models/Stocks.js";

const stocklevel = async ({ req }: { req: ExpressRequest }) => {
  const typeSchema = z.object({
    type: z.enum(["item", "bag", "pressure"]),
    store: zodFields.objectId("store id").optional(),
  });
  const Product = getProductModel(req.db!);
  const Store = getStoreModel(req.db!);
  const Stocks = getStocksModel(req.db!);
  const { type, store } = typeSchema.parse(req.query);
  const items = await Product.find().lean();
  // 1. Fetch all active stores to ensure we have columns for them
  let query: any = {
    isDeleted: false,
  };
  let storeMatches: any = {};
  if (store) {
    const storeId = new mongoose.Types.ObjectId(store);
    query._id = new mongoose.Types.ObjectId(store);
    storeMatches = {
      $or: [{ from: storeId }, { to: storeId }],
    };
  }
  const stores = await Store.find(query).select("_id name");

  const storeMap: Record<string, string> = {};
  stores.forEach((s: any) => {
    storeMap[s._id.toString()] = s.name;
  });

  // 2. Aggregation: Calculate balances per Item per Store
  const stocks = await Stocks.aggregate([
    {
      $match: {
        ...storeMatches,
      },
    },
    {
      $lookup: {
        from: "transactions",
        localField: "transaction",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              stockType: type,
              isDeleted: false,
            },
          },
        ],
        as: "transaction",
      },
    },
    {
      $unwind: "$transaction",
    },
    {
      $project: {
        item: "$product",
        impacts: [
          { store: "$to", qty: "$quantity" },
          { store: "$from", qty: { $multiply: ["$quantity", -1] } },
        ],
      },
    },
    { $unwind: "$impacts" },
    { $match: { "impacts.store": { $exists: true, $ne: null } } },

    // Calculate net balance for each Store for this Item
    {
      $group: {
        _id: {
          item: "$item",
          store: "$impacts.store",
        },
        balance: { $sum: "$impacts.qty" },
      },
    },

    // Group by Item to collect all store balances
    {
      $group: {
        _id: "$_id.item",
        storeBalances: {
          $push: {
            store: "$_id.store",
            balance: "$balance",
          },
        },
        total: { $sum: "$balance" },
      },
    },

    // Lookup Item/Bag details
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "details",
      },
    },
    { $unwind: { path: "$details", preserveNullAndEmptyArrays: true } },
  ]);

  // 3. Post-process to pivot and format
  const result = stocks.map((row) => {
    const item = row.details || {};
    const label = item.name;
    const itemsData = (item.items || []).map((i: any) => {
      return {
        ...i,
        data: items.find(
          (item: any) => item._id.toString() === i.product.toString(),
        ),
      };
    });
    // Base Row
    const finalRow: any = {
      _id: row._id,
      label,

      total: row.total,
      // Include raw details if needed by frontend
      ...(type === "item"
        ? {
            name: item.name,

            cost: item.cost,
            imgUrl: item.imgUrl,
            totalValue: item.cost * row.total,
          }
        : {
            name: item.name,
            type: item.type,
            items: itemsData,
            totalValue:
              itemsData.reduce(
                (acc: any, i: any) => acc + i.quantity * i.cost,
                0,
              ) * row.total,
            totalCost: itemsData.reduce(
              (acc: any, i: any) => acc + i.quantity * i.cost,
              0,
            ),
            search: itemsData.map((i: any) => `${i.data.name}`).join(" "),
          }),
    };

    // Fill in balances for stores found in data
    row.storeBalances?.forEach((sb: any) => {
      const sName = storeMap[sb.store.toString()];

      if (sName) {
        finalRow[sName] = sb.balance;
        if (store) {
          finalRow["totalValue"] = sb.balance * item.cost;
        }
      }
    });

    // Ensure ALL stores have a column (even if balance is 0 or missing in data)
    stores.forEach((s) => {
      if (finalRow[s.name] === undefined) {
        finalRow[s.name] = 0;
      }
    });

    return finalRow;
  });

  // Sort alphabetically by label
  return result.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
};

export default stocklevel;
