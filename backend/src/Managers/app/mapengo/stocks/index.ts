import z from "zod";
import { ExpressRequest } from "../../../../types/Express.js";
import StockManager from "./stockManager.js";
import { ClientSession } from "mongoose";

const schema = z.object({
  method: z.enum(["create", "get", "stockLevel", "productReport"]),
});

const mapengoStockController = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { method } = schema.parse(req.query);
  const Stock = new StockManager({ req, session });
  const resData = await Stock[method]();

  return resData;
};

export default mapengoStockController;
