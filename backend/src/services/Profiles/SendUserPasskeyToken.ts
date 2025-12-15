import mongoose from 'mongoose';
import { passwordEncryption } from '../../func/Encryptions.js';

import createVerification from '../verifications/create.js';
import Emails from '../Messages/emails/index.js';
import getUserModel from '../../models/profiles/User.js';
import { AppDocument } from '../../models/app.js';

const SendUserPasskeyToken = async ({
  id,
  session,
  dbName,
  app,
}: {
  id: string | mongoose.Types.ObjectId;
  session: mongoose.ClientSession;
  dbName: string;
  app: AppDocument;
}) => {
  const Model = getUserModel(dbName);
  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`User not found`);
  }

  const pass = await passwordEncryption.generatePasskeyToken();
  await createVerification({
    model: 'user',
    profile: { _id: isExist._id.toString(), name: isExist.name },
    type: 'password-reset',
    token: pass.hash,
    expires: pass.expire,
    session,
    dbName,
  });
  const user = isExist;
  let url = `https://${app?.host}${process.env.DOMAIN}`;
  if (app.type === 'private') {
    url = `https://${app?.host}`;
  }
  // send to email the reset password token
  const sendEmail = await Emails.passwodToken({
    name: `${user.name} ${user.surname}`,
    email: user.email,
    resetLink: `${url}/reset-password?token=${pass.token}&email=${user.email}`,
    subject: 'Password Reset',
    company: app?.name,
    title: 'Password Reset Token',
    message: 'Please click the Button below to reset your password.',
  });
  if (!sendEmail.ok) {
    throw new Error(sendEmail.message || 'Sending Password Reset Token Failed');
  }
  return user;
};

export default SendUserPasskeyToken;
