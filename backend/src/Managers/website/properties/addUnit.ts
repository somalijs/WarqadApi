import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getPropertyUnitModel from "../../../models/PropertyUnits.js";
import getPropertyModel from "../../../models/Properties.js";
import { propertyUnitCreateSchema } from "./schema.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const addUnit = async ({ req, session }: props) => {
  const PropertyUnit = getPropertyUnitModel(req.db!);
  const Property = getPropertyModel(req.db!);
  const data = propertyUnitCreateSchema.parse(req.body);

  // Verify parent property exists and is not deleted
  const parentProperty = await Property.findOne({
    _id: data.property,
    isDeleted: false,
  }).session(session);

  if (!parentProperty) {
    throw new Error("Parent property not found or is deleted");
  }

  const res = await PropertyUnit.create(
    [
      {
        ...data,
        by: req.by,
      },
    ],
    { session }
  );

  if (!res[0]) throw new Error("Failed to add property unit");
  return res[0];
};

export default addUnit;
