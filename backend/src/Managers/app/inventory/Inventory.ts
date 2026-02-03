import z from "zod";
import Enums from "../../../func/Enums.js";
import { ExpressRequest } from "../../../types/Express.js";
import { ClientSession } from "mongoose";
import ProductManager from "./ProductManager.js";

const schema = z.object({
  inventory: z.enum(Enums.inventory),
  method: z.enum(["get", "add", "update", "delete", "image", "deleteimage"]),
});

const InventoryBox = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session?: ClientSession;
}) => {
  const { inventory, method } = schema.parse(req.query);
  let response;
  const Product = new ProductManager({
    req,
    session,
  });
  switch (inventory) {
    case "product":
      response = await Product[method]();
      break;
    default:
      throw new Error("Invalid inventory type");
  }
  return response;
};

export default InventoryBox;
