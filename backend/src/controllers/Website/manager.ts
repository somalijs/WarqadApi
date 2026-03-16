import expressAsyncHandler from "express-async-handler";
import { ExpressRequest, ExpressResponse } from "../../types/Express.js";
import { z } from "zod";
import mongoose from "mongoose";
import { handleTransactionError } from "../../func/Errors.js";
import propertiesController from "../../Managers/website/index.js";
import privateClientsController from "../../Managers/website/clients/private.js";

const schema = z.object({
  type: z.enum(["property", "clients"]),
});
const websiteManager = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    let resData: any;
    const session = await mongoose.startSession();
    session.startTransaction();
    const { type } = schema.parse(req.params);

    try {
      switch (type) {
        case "property":
          resData = await propertiesController({ req, session });
          break;
        case "clients":
          resData = await privateClientsController({ req, session });
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

export default websiteManager;
