import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';

import User from '../../../services/Profiles/users/index.js';
import getUserModel from '../../../models/profiles/User.js';

import { handleTransactionError } from '../../../func/Errors.js';
import { isAppExist } from './index.js';
const createUser = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const isApp = await isAppExist(req);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const createdUser = await User.create({
        req,
        session,
        Model: getUserModel(isApp?.ref),
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
    const isApp = await isAppExist(req);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedUser = await User.updateDetails({
        req,
        session,
        Model: getUserModel(isApp?.ref),
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
const activateUser = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const isApp = await isAppExist(req);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedUser = await User.activate({
        req,
        session,
        Model: getUserModel(isApp?.ref),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: `${
          updatedUser.isActive
            ? 'User activated successfully'
            : 'User deactivated successfully'
        }`,
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
    const isApp = await isAppExist(req);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedEmail = await User.updateEmail({
        req,
        session,
        Model: getUserModel(isApp?.ref),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'Email updated successfully',
        data: updatedEmail,
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
    const isApp = await isAppExist(req);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedPhone = await User.updatePhone({
        req,
        session,
        Model: getUserModel(isApp?.ref),
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'Phone updated successfully',
        data: updatedPhone,
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
    const isApp = await isAppExist(req);
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updatedPhone = await User.resetPassword({
        req,
        session,
        Model: getUserModel(isApp?.ref),
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
export {
  createUser,
  updateDetails,
  activateUser,
  updateEmail,
  updatePhone,
  resetPassword,
};
