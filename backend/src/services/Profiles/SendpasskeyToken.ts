import mongoose, { Model } from 'mongoose';
import { DocumentProfile } from '../../models/profiles/profile.js';
import { passwordEncryption } from '../../func/Encryptions.js';

import createVerification from '../verifications/create.js';
import Emails from '../Messages/emails/index.js';
import { DocumentUser } from '../../models/profiles/User.js';
type ProfileTypeMap = {
  user: DocumentUser;
  agent: DocumentProfile;
};
const SendPasskeyToken = async <T extends keyof ProfileTypeMap>({
  id,
  Model,
  profile,
  session,
  dbName,
}: {
  id: string | mongoose.Types.ObjectId;
  session: mongoose.ClientSession;
  Model: Model<ProfileTypeMap[T]>;
  profile: T;
  dbName: string;
}) => {
  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`${profile} not found`);
  }

  const pass = await passwordEncryption.generatePasskeyToken();
  await createVerification({
    model: profile,
    profile: { _id: isExist._id.toString(), name: isExist.name },
    type: 'password-reset',
    token: pass.hash,
    expires: pass.expire,
    session,
    dbName,
  });
  const user = isExist;
  // send to email the reset password token
  const sendEmail = await Emails.passwodToken({
    name: `${user.name} ${user.surname}`,
    email: user.email,
    resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${pass.token}&email=${user.email}&profile=${profile}`,
    subject: 'Password Reset',
    company: 'Warqad.com',
    title: 'Password Reset Token',
    message: 'Please click the Button below to reset your password.',
  });
  if (!sendEmail.ok) {
    throw new Error(sendEmail.message || 'Sending Password Reset Token Failed');
  }
  return user;
};

export default SendPasskeyToken;
