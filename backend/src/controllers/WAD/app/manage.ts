import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import App from '../../../services/Apps/index.js';
import { handleTransactionError } from '../../../func/Errors.js';
const createApp = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const create = await App.create({
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
const updateApp = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const update = await App.update({
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
const activateApp = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const activate = await App.activate({
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
const generateNewSecretKey = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const key = await App.generateNewSecretKey({
        req,
        session,
        appId: req.params.id,
      });
      await session.commitTransaction();

      res.status(200).json({
        key: key,
      });
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
const manageDomains = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const update = await App.Domains({
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

export {
  createApp,
  updateApp,
  activateApp,
  generateNewSecretKey,
  manageDomains,
};
