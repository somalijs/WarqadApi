import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getPropertyModel from "../../../models/Properties.js";
import { propertyUpdateSchema } from "./schema.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const updateProperty = async ({ req, session }: props) => {
  const Property = getPropertyModel(req.db!);
  const { id, ...data } = propertyUpdateSchema.parse(req.body);

  const updated = await Property.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $set: {
        ...data,
      },
    },
    { session, new: true }
  );

  if (!updated) throw new Error("Property not found or already deleted");
  return updated;
};

export default updateProperty;
