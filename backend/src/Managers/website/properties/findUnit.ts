import { z } from "zod";
import { ExpressRequest } from "../../../types/Express.js";
import mongoose from "mongoose";
import getPropertyUnitModel from "../../../models/PropertyUnits.js";

const querySchema = z.object({
  id: z.string().optional(),
});

type props = {
  req: ExpressRequest;
};

const findUnit = async ({ req }: props) => {
  const query = querySchema.parse(req.query);
  const PropertyUnit = getPropertyUnitModel(req.db!);
  const match: any = { isDeleted: false };
  if (query.id) {
    match._id = new mongoose.Types.ObjectId(query.id);
  }
  const units = await PropertyUnit.aggregate([
    {
      $match: match,
    },
  ]);

  if (query.id && !units[0]) throw new Error("Property unit not found");

  return query.id ? units[0] : units;
};

export default findUnit;
