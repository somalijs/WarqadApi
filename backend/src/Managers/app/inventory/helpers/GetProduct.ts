import { Model } from "mongoose";
import { ProductDocument } from "../../../../models/inventory/Product.js";

export async function getProducts({
  matches,
  Model,
}: {
  matches: any;
  Model: Model<ProductDocument>;
}) {
  const data = await Model.aggregate([
    {
      $match: matches,
    },
    // Add any lookups here if needed (e.g., transactions, though products might not have direct transactions like accounts)
    // For now, basic retrieval with store info
    {
      $lookup: {
        from: "users", // Assuming 'by' references a user
        localField: "by._id",
        foreignField: "_id",
        as: "creator",
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
