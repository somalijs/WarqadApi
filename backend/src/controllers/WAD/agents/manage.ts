import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import Agent from '../../../services/Profiles/agents/index.js';
import { handleTransactionError } from '../../../func/Errors.js';
import deleteToken from '../../../services/tokens/delete.js';
const createAgent = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const createdAgent = await Agent.create({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(201).json({
        success: true,
        message: 'Agent created successfully',
        data: createdAgent,
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
      const updatedAgent = await Agent.updateDetails({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Agent updated successfully',
        data: updatedAgent,
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
      const updatedAgentEmail = await Agent.updateEmail({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Agen Email updated successfully',
        data: updatedAgentEmail,
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
      const updatedAgentPhone = await Agent.updatePhone({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Agent Phone updated successfully',
        data: updatedAgentPhone,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const activate = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const activatedAgent = await Agent.activate({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Agent activated successfully',
        data: activatedAgent,
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
      const resetPasswordData = await Agent.resetPassword({
        req,
        session,
      });
      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: 'Password reset sent to email successfully',
        data: resetPasswordData,
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
      const updatePasswordData = await Agent.updatePassword({
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
export {
  createAgent,
  updateDetails,
  updateEmail,
  updatePhone,
  activate,
  resetPassword,
  updatePassword,
};
