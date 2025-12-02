import { ClientSession } from 'mongoose';
import z from 'zod';
import { ExpressRequest } from '../../../../types/Express.js';

import getVerificationModel from '../../../../models/verification.js';
import { passwordEncryption } from '../../../../func/Encryptions.js';
import zodFields from '../../../../zod/Fields.js';
import getAppModel from '../../../../models/app.js';
import getUserModel from '../../../../models/profiles/User.js';

const schema = z.object({
  token: z.string('Token is required'),
  email: z.email('Email is required'),
  app: zodFields.objectId('App Id'),
});

const verifyPasswordToken = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { token, email, app } = schema.parse(req.body);
  const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
  if (!isApp) {
    throw new Error('App not found');
  }
  if (!isApp.isActive) {
    throw new Error('Your app is not active! Please contact support');
  }
  const dbName = isApp.ref;
  const Model = getUserModel(dbName);
  const isExist = await Model.findOne({ email, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`User not found`);
  }
  // check if token is exist
  const isTokenExist = await getVerificationModel(dbName).findOne({
    type: 'password-reset',
    'profile._id': isExist._id,
    model: 'user',
    isUsed: false,
  });
  if (!isTokenExist) {
    throw new Error('There is no password reset for this profile');
  }
  // check if token is expired
  if (isTokenExist.expires < Date.now()) {
    throw new Error('Token expired, please request a new token');
  }
  // verify the token
  const isTokenValid = await passwordEncryption.verifyPasskeyToken({
    token: token,
    hash: isTokenExist.token,
  });
  if (!isTokenValid) {
    throw new Error('Invalid password reset token');
  }
  return {
    id: isExist._id,
    oldPassword: isExist.password,
    tokenId: isTokenExist._id,
  };
};

export default verifyPasswordToken;
