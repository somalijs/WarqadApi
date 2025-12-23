import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../types/Express.js';
import AccountsManager from '../../Managers/app/accounts/index.js';
import z from 'zod';
import mongoose from 'mongoose';
import { handleTransactionError } from '../../func/Errors.js';
import DrawerManager from '../../Managers/app/drawers/index.js';
import TransactionSchema from '../../Managers/app/transaction/schema.js';

import TransactionManager from '../../Managers/app/transaction/index.js';

const schema = z.object({
  type: z.enum(['account', 'drawer', 'transaction']),
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
        case 'transaction':
          const { types } = TransactionSchema.types.parse(req.query);
          const Transaction = new TransactionManager({
            db: req.db!,
            req,
            session: session,
          });
          if (
            [
              'customer-broker-invoice',
              'broker-invoice',
              'supplier-invoice',
              'employee-invoice',
              'drawer-adjustment',
            ].includes(types)
          ) {
            resData = await Transaction.addAdjustment(req.query?.ref as string);
          } else if (types === 'payment') {
            resData = await Transaction.addPayment(req.query?.ref as string);
          } else if (types === 'money-transfer') {
            resData = await Transaction.MoneyTransfer(req.query?.ref as string);
          } else if (types === 'expenses') {
            resData = await Transaction.addExpenses(req.query?.ref as string);
          } else {
            throw new Error('Invalid type for transaction');
          }
          break;
        default:
          throw new Error('Invalid type');
      }
      if (!resData) throw new Error('Creation failed on Controller');
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
