import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import Account from '../../../services/Accounts/index.js';
import { handleTransactionError } from '../../../func/Errors.js';

const addAccount = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const createdAccount = await Account.create({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: createdAccount,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const editAccount = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const editedAccount = await Account.edit({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Account updated successfully',
        data: editedAccount,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const deleteAccount = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const editedAccount = await Account.delete({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        data: editedAccount,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
export { addAccount, editAccount, deleteAccount };
