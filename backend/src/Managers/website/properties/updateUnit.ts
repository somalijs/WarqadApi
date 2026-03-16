import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getPropertyUnitModel from "../../../models/PropertyUnits.js";
import { propertyUnitUpdateSchema } from "./schema.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const updateUnit = async ({ req, session }: props) => {
  const PropertyUnit = getPropertyUnitModel(req.db!);
  const { id, ...data } = propertyUnitUpdateSchema
    .omit({ property: true })
    .parse(req.body);

  const updated = await PropertyUnit.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $set: {
        ...data,
      },
    },
    { session, new: true },
  );

  if (!updated) throw new Error("Property unit not found or already deleted");
  return updated;
};

export default updateUnit;
