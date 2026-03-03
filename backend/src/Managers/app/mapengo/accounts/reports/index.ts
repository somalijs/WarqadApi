import z from "zod";

import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../../types/Express.js";
import MapengoAccounts from "../MapengoAccounts.js";

const schema = z.object({
  method: z.enum(["reports"]),
});

const mapengoStockController = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { method } = schema.parse(req.query);
  const mapengoAccounts = new MapengoAccounts({ req, session });
  const resData = await mapengoAccounts[method]();

  return resData;
};

export default mapengoStockController;
