import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';

import { passwordEncryption } from '../../../../func/Encryptions.js';

import addLogs from '../../../Logs.js';
import { DocumentUser } from '../../../../models/profiles/User.js';

import { Model } from 'mongoose';
import getAppModel, { AppDocument } from '../../../../models/app.js';
import SendUserPasskeyToken from '../../SendUserPasskeyToken.js';

const schema = z.object({
  id: zodFields.objectId('Profile ID is required'),
  passkey: z.string('Password is required'),
});
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
const resetPassword = async ({
  req,
  session,
  Model,
}: {
  req: ExpressRequest;
  session: ClientSession;
  Model: Model<DocumentUser>;
}) => {
  const { id, passkey } = schema.parse(req.body);
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
  const confrimPasskey = await passwordEncryption.compare(
    passkey,
    req.password!
  );
  if (!confrimPasskey) {
    throw new Error('Invalid Admin Passkey');
  }
  // send passkey to email
  // sned password reset token
  await SendUserPasskeyToken({
    id: isExist._id,
    session,
    dbName,
    app: isApp,
  });
  await addLogs({
    model: { type: 'user', _id: isExist._id },
    data: {
      action: 'password reset sent to email',
    },
    by: req.by!,
    action: 'update',
    session,
  });
  return isExist;
};
export const resetPasswordViaEmail = async ({
  req,
  session,
  Model,
  app,
}: {
  req: ExpressRequest;
  session: ClientSession;
  Model: Model<DocumentUser>;
  app: AppDocument;
}) => {
  const { email } = emailSchema.parse(req.body);
  const isExist = await Model.findOne({
    email: email,
    isDeleted: false,
  }).session(session);
  if (!isExist) {
    throw new Error(`This email is not registered with us`);
  }

  // sned password reset token
  await SendUserPasskeyToken({
    id: isExist._id,
    session,
    dbName: app?.ref,
    app: app,
  });
  await addLogs({
    model: { type: 'user', _id: isExist._id },
    data: {
      action: 'password reset sent to email',
    },
    by: {
      _id: isExist._id,
      name: isExist.name,
    },
    action: 'update',
    session,
  });
  return isExist;
};
export default resetPassword;
