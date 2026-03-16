import { z } from "zod";
import getPropertyModel from "../../../models/Properties.js";
import { ExpressRequest } from "../../../types/Express.js";
import mongoose from "mongoose";

const querySchema = z.object({
  id: z.string().optional(),
});

type props = {
  req: ExpressRequest;
};

const findProperty = async ({ req }: props) => {
  const query = querySchema.parse(req.query);
  const Property = getPropertyModel(req.db!);
  const match: any = { isDeleted: false };
  if (query.id) {
    match._id = new mongoose.Types.ObjectId(query.id);
  }
  const property = await Property.aggregate([
    {
      $match: match,
    },
    {
      $lookup: {
        from: "propertyunits",
        localField: "_id",
        foreignField: "property",
        pipeline: [{ $match: { isDeleted: false } }],
        as: "units",
      },
    },
  ]);

  if (query.id && !property[0]) throw new Error("Property not found");

  return query.id ? property[0] : property;
};

export default findProperty;
