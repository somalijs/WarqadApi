import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import User from '../../../services/Profiles/users/index.js';
import deleteToken from '../../../services/tokens/delete.js';
import { handleTransactionError } from '../../../func/Errors.js';
import getUserModel from '../../../models/profiles/User.js';
import getAppModel from '../../../models/app.js';
const createUser = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const createdUser = await User.create({
        req,
        session,
        Model: getUserModel(req.db!),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: createdUser,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const updateDetails = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedUser = await User.updateDetails({
        req,
        session,
        Model: getUserModel(req.db!),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'User details updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
export const activateUser = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedUser = await User.activate({
        req,
        session,
        Model: getUserModel(req.db!),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: `User ${
          updatedUser.isActive ? 'activated' : 'deactivated'
        } successfully`,
        data: updatedUser,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const updatePhone = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedUser = await User.updatePhone({
        req,
        session,
        Model: getUserModel(req.db!),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'User phone updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const updateEmail = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedUser = await User.updateEmail({
        req,
        session,
        Model: getUserModel(req.db!),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'User email updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const updatePassword = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatePasswordData = await User.updatePassword({
        req,
        session,
      });
      await session.commitTransaction();
      deleteToken(res, 'authToken');
      res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        data: updatePasswordData,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const resetPassword = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedPhone = await User.resetPassword({
        req,
        session,
        Model: getUserModel(req.db!),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'password reset sent to email successfully',
        data: updatedPhone,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
export const resetPasswordViaEmail = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { app } = req.params;
      const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
      if (!isApp) {
        throw new Error('App not found');
      }
      const resetPassword = await User.resetPasswordViaEmail({
        req,
        session,
        Model: getUserModel(isApp.ref),
        app: isApp,
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'password reset sent to email successfully',
        data: resetPassword,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const storeAccess = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updated = await User.storeAccess({
        req,
        session,
        dbName: req.db!,
      });
      await session.commitTransaction();
      res.status(201).json(updated);
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
export {
  updatePassword,
  createUser,
  updateDetails,
  updatePhone,
  updateEmail,
  resetPassword,
  storeAccess,
};
