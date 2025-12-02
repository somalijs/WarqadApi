import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import { handleTransactionError } from '../../../func/Errors.js';
import Agent from '../../../services/Profiles/agents/index.js';

const resendEmailVerification = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Agent.resendEmailVerification({
        req,
        session,
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
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Agent.verifyEmail({
        req,
        session,
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
const verifyPasswordToken = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const verifyPasswordTokenData = await Agent.verifyPasswordToken({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: `Password reset token is valid`,
        data: verifyPasswordTokenData,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
export { resendEmailVerification, verifyEmail, verifyPasswordToken };
