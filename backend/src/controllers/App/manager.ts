import expressAsyncHandler from "express-async-handler";
import { ExpressRequest, ExpressResponse } from "../../types/Express.js";
import { z } from "zod";
import InventoryBox from "../../Managers/app/inventory/Inventory.js";
import mongoose from "mongoose";
import { handleTransactionError } from "../../func/Errors.js";

const schema = z.object({
  type: z.enum(["inventory"]),
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

        default:
          throw new Error("Invalid typea");
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
