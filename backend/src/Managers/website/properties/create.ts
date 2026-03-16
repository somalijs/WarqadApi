import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import getPropertyModel from "../../../models/Properties.js";
import { propertyCreateSchema } from "./schema.js";

type props = {
  req: ExpressRequest;
  session: ClientSession;
};

const createProperty = async ({ req, session }: props) => {
  const Property = getPropertyModel(req.db!);
  const data = propertyCreateSchema.parse(req.body);

  const res = await Property.create(
    [
      {
        ...data,
        store: req.body.store,
        by: req.by,
      },
    ],
    { session },
  );
  if (!res[0]) throw new Error("Failed to create property");
  return res[0];
};

export default createProperty;
