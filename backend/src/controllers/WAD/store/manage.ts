import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import Store from '../../../services/Stores/index.js';
import { handleTransactionError } from '../../../func/Errors.js';

const createStore = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const create = await Store.create({
        req,
        session,
      });
      await session.commitTransaction();

      res.status(201).json(create);
    } catch (error) {
      await handleTransactionError({
        error,
        session,
      });
    } finally {
      session.endSession();
    }
  }
);

const updateStoreDetails = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const update = await Store.updateDetails({
        req,
        session,
      });
      await session.commitTransaction();

      res.status(200).json(update);
    } catch (error) {
      await handleTransactionError({
        error,
        session,
      });
    } finally {
      session.endSession();
    }
  }
);

const activateStore = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const activate = await Store.activate({
        req,
        session,
      });
      await session.commitTransaction();

      res.status(200).json(activate);
    } catch (error) {
      await handleTransactionError({
        error,
        session,
      });
    } finally {
      session.endSession();
    }
  }
);

export { createStore, updateStoreDetails, activateStore };
