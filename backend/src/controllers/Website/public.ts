import expressAsyncHandler from "express-async-handler";
import { ExpressRequest, ExpressResponse } from "../../types/Express.js";
import { z } from "zod";
import mongoose from "mongoose";
import { handleTransactionError } from "../../func/Errors.js";
import publicController from "../../Managers/website/public.js";
import getAppModel from "../../models/app.js";
import publicClientsController from "../../Managers/website/clients/public.js";

const schema = z.object({
  type: z.enum(["property", "clients"]),
});
const dbSchema = z.object({
  db: z.string(),
});
const websitePublic = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    let resData: any;
    const session = await mongoose.startSession();
    session.startTransaction();
    const { type } = schema.parse(req.params);
    const { db } = dbSchema.parse(req.query);
    try {
      const isDbExist = await getAppModel().findOne({ ref: db });
      if (!isDbExist) throw new Error("Website not found");
      req.db = isDbExist.ref;
      switch (type) {
        case "property":
          resData = await publicController({ req, session });
          break;
        case "clients":
          resData = await publicClientsController({ req, session });
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

export default websitePublic;
