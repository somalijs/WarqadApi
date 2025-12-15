import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import AccountsManager from '../../Managers/app/accounts/index.js';
import z from 'zod';
import mongoose from 'mongoose';
import { handleTransactionError } from '../../func/Errors.js';
import DrawerManager from '../../Managers/app/drawers/index.js';

const schema = z.object({
  type: z.enum(['account', 'drawer']),
});
const appCreateController = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { type } = schema.parse(req.params);
    let resData;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      switch (type) {
        case 'account':
          const Account = new AccountsManager({
            db: req.db!,
            req,
            session: session,
          });
          resData = await Account.add();
          break;
        case 'drawer':
          const Model = new DrawerManager({
            db: req.db!,
            req,
            session: session,
          });
          resData = await Model.add();
          break;
        default:
          throw new Error('Invalid type');
      }
      await session.commitTransaction();
      res.status(200).json(resData);
    } catch (error) {
      await handleTransactionError({ session, error });
    } finally {
      await session.endSession();
    }
  }
);

export default appCreateController;
