import z from 'zod';

import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession, Model } from 'mongoose';

import getVerificationModel from '../../../../models/verification.js';
import { codeEncryption } from '../../../../func/Encryptions.js';
import createVerification from '../../../verifications/create.js';
import Emails from '../../../Messages/emails/index.js';
import { DocumentUser } from '../../../../models/profiles/User.js';
import getAppModel from '../../../../models/app.js';
const schema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});

const resendEmailVerification = async ({
  req,
  session,
  Model,
}: {
  req: ExpressRequest;
  session: ClientSession;
  Model: Model<DocumentUser>;
}) => {
  const { id } = schema.parse(req.params);
  // check if profile exists
  const isExist = await Model.findById(id).session(session);
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
  // check if profile is email has verification
  const hasVerification = await getVerificationModel(dbName).findOne({
    'profile._id': isExist._id,
    type: 'email-verification',
    model: 'user',
    isUsed: false,
    email: { $exists: true },
  });
  if (!hasVerification) {
    throw new Error(`There is no email verification for this user`);
  }
  const token = await codeEncryption.generateOtp();
  const user = isExist;
  // create new verification
  await createVerification({
    model: 'user',
    profile: { _id: isExist._id.toString(), name: isExist.name },
    type: 'email-verification',
    email: hasVerification.email as string,
    token: token.hash,
    expires: token.expire,
    session,
    dbName,
  });
  const sendEmail = await Emails.Verification({
    name: `${user.name} ${user.surname}`,
    email: user.email,
    token: token.code,
    subject: 'Email Verification',
    company: isApp?.name,
    title: 'Email Verification Token',
    message: 'Please use the following token to verify your email address.',
  });
  if (!sendEmail.ok) {
    throw new Error(
      sendEmail.message || 'Sending Email Verification Token Failed'
    );
  }
  return user;
};

export default resendEmailVerification;
