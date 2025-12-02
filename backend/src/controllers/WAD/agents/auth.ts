import expressAsyncHandler from 'express-async-handler';
import { ExpressRequest, ExpressResponse } from '../../../types/Express.js';
import mongoose from 'mongoose';
import Agent from '../../../services/Profiles/agents/index.js';
import { handleTransactionError } from '../../../func/Errors.js';
import createToken from '../../../services/tokens/create.js';
import deleteToken from '../../../services/tokens/delete.js';
const EmailLogin = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const login = await Agent.EmailLogin({
        req,
        session,
      });
      await session.commitTransaction();
      // set cookie
      const cookieName = 'authToken';
      await createToken({
        res,
        name: cookieName,
        decoded: login._id.toString(),
      });
      res.status(200).json({
        success: true,
        message: 'Agent logged in successfully',
        data: login,
      });
    } catch (error) {
      await handleTransactionError({ error, session });
    } finally {
      await session.endSession();
    }
  }
);
const logout = async (_req: ExpressRequest, res: ExpressResponse) => {
  deleteToken(res, 'authToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const getMe = expressAsyncHandler(
  async (req: ExpressRequest, res: ExpressResponse) => {
    const resData = {
      id: req.id,
      names: req.names,
      name: req.name,
      surname: req.surname,
      phoneNumber: req.phoneNumber,
      email: req.email,
      role: req.role,
      status: req.status,
      sex: req.sex,
      isEmailVerified: req.isEmailVerified,
      isPhoneVerified: req.isPhoneVerified,
    };
    res.status(200).json(resData);
  }
);

export { EmailLogin, logout, getMe };
