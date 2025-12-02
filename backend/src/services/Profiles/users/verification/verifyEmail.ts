import z from 'zod';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession, Model } from 'mongoose';
import zodFields from '../../../../zod/Fields.js';

import getVerificationModel from '../../../../models/verification.js';
import { codeEncryption } from '../../../../func/Encryptions.js';
import { DocumentUser } from '../../../../models/profiles/User.js';
import getAppModel from '../../../../models/app.js';
import addLogs from '../../../Logs.js';
import SendUserPasskeyToken from '../../SendUserPasskeyToken.js';
const schema = z.object({
  id: zodFields.objectId('Profile ID is required'),
  token: z.string('Token is required'),
});

const verifyEmail = async ({
  req,
  session,
  Model,
}: {
  req: ExpressRequest;
  session: ClientSession;
  Model: Model<DocumentUser>;
}) => {
  const { id, token } = schema.parse(req.body);

  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`User not found`);
  }
  const isApp = await getAppModel().findOne({
    _id: isExist.app,
    isDeleted: false,
  });
  if (!isApp) {
    throw new Error('App not found');
  }
  const dbName = isApp?.ref;
  // check if token is Exist
  const isTokenExist = await getVerificationModel(dbName).findOne({
    'profile._id': isExist._id,
    type: 'email-verification',
    model: 'user',
    email: { $exists: true },
    isUsed: false,
  });
  if (!isTokenExist) {
    throw new Error('There is no email verification for this profile');
  }
  // validate the Token
  const isTokenValid = await codeEncryption.validateOtp(
    token,
    isTokenExist.token
  );
  if (!isTokenValid) {
    throw new Error('Invalid Token');
  }

  // check if token is expired
  if (isTokenExist.expires < Date.now()) {
    throw new Error('Token expired, please request a new token');
  }
  // update the token
  const useToken = await getVerificationModel(dbName).findByIdAndUpdate(
    isTokenExist._id,
    { isUsed: true },
    { new: true, session, runValidators: true }
  );
  if (!useToken) {
    throw new Error('Unable to use token');
  }
  // check if email is already in use
  const isEmailInUse = await Model.findOne({
    email: isTokenExist.email,
    _id: { $ne: isExist._id },
    isDeleted: false,
  }).session(session);
  if (isEmailInUse) {
    throw new Error(
      `Email ${isTokenExist.email} is already in use, and ${
        isEmailInUse.isEmailVerified ? 'verified' : 'not verified'
      } by ${isEmailInUse.name} ${isEmailInUse.surname}`
    );
  }
  // update profile
  const updateData: any = {
    email: isTokenExist.email,
  };
  if (!isExist.isEmailVerified) {
    updateData.isEmailVerified = true;
    updateData.isActive = true;
  }
  const updateProfile = await Model.findByIdAndUpdate(isExist._id, updateData, {
    new: true,
    session,
    runValidators: true,
  });
  if (!updateProfile) {
    throw new Error('Unable to update profile');
  }
  // await add logs
  await addLogs({
    model: { type: 'user', _id: isExist._id },
    data: {
      email: updateProfile.email,
      action: 'verified email',
    },
    by: req.by!,
    action: 'update',
    dbName,
    session,
  });
  if (!isExist.isEmailVerified && !isExist.isActive) {
    // sned password reset token
    await SendUserPasskeyToken({
      id: isExist._id,
      session,
      dbName,
      app: isApp,
    });
  }

  return updateProfile;
};

export default verifyEmail;
