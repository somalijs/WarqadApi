import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getPropertyModel from "../../../models/Properties.js";
import { propertyDeleteSchema } from "./schema.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const deleteProperty = async ({ req, session }: props) => {
  const Property = getPropertyModel(req.db!);
  const { id } = propertyDeleteSchema.parse(req.query);

  const property = await Property.findOne({ _id: id }).session(session);
  if (!property) throw new Error("Property not found");
  if (property.isDeleted) throw new Error("Property already deleted");

  property.isDeleted = true;
  await property.save({ session });

  return { message: "Property deleted successfully" };
};

export default deleteProperty;
