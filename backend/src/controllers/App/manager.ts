import expressAsyncHandler from "express-async-handler";
import { ExpressRequest, ExpressResponse } from "../../types/Express.js";
import { z } from "zod";
import InventoryBox from "../../Managers/app/inventory/Inventory.js";
import mongoose from "mongoose";
import { handleTransactionError } from "../../func/Errors.js";
import mapengoStockController from "../../Managers/app/mapengo/stocks/index.js";

const schema = z.object({
  type: z.enum(["inventory", "mapengo-stock"]),
});
const appManager = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    let resData;
    const session = await mongoose.startSession();
    session.startTransaction();
    const { type } = schema.parse(req.params);

    try {
      switch (type) {
        case "inventory":
          resData = await InventoryBox({
            req,
            session,
          });
          break;
        case "mapengo-stock":
          resData = await mapengoStockController({
            req,
            session,
          });
          break;
        default:
          throw new Error("Invalid type");
      }
      await session.commitTransaction();

      res.status(200).json(resData);
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      session.endSession();
    }
  },
);

export default appManager;
