import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import { handleTransactionError } from '../../../func/Errors.js';
import User from '../../../services/Profiles/users/index.js';
import { isAppExist } from './index.js';
import getUserModel from '../../../models/profiles/User.js';

const resendEmailVerification = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const isApp = await isAppExist(req);
    try {
      await User.resendEmailVerification({
        req,
        session,
        Model: getUserModel(isApp?.ref),
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Email Token has been resent',
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);

const verifyEmail = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const isApp = await isAppExist(req);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await User.verifyEmail({
        req,
        session,
        Model: getUserModel(isApp?.ref),
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: `Email Verified successfully`,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);

export { resendEmailVerification, verifyEmail };
