import z from "zod";

import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../types/Express.js";
import PropertiesManager from "./properties/PropertiesManager.js";

const schema = z.object({
  method: z.enum([
    "get",
    "find",
    "findUnit",
    "create",
    "update",
    "delete",
    "addUnit",
    "updateUnit",
    "deleteUnit",
  ]),
});

const propertiesController = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { method } = schema.parse(req.query);
  const mapengoAccounts = new PropertiesManager({ req, session });
  const resData = await mapengoAccounts[method]();

  return resData;
};

export default propertiesController;
