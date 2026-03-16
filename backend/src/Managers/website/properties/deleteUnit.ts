import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getPropertyUnitModel from "../../../models/PropertyUnits.js";
import { propertyUnitDeleteSchema } from "./schema.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const deleteUnit = async ({ req, session }: props) => {
  const PropertyUnit = getPropertyUnitModel(req.db!);
  const { id } = propertyUnitDeleteSchema.parse(req.query);

  const unit = await PropertyUnit.findOne({ _id: id }).session(session);
  if (!unit) throw new Error("Property unit not found");
  if (unit.isDeleted) throw new Error("Property unit already deleted");

  unit.isDeleted = true;
  await unit.save({ session });

  return { message: "Property unit deleted successfully" };
};

export default deleteUnit;
