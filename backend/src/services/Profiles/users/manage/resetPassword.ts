import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';

import { passwordEncryption } from '../../../../func/Encryptions.js';

import addLogs from '../../../Logs.js';
import { DocumentUser } from '../../../../models/profiles/User.js';

import { Model } from 'mongoose';
import getAppModel from '../../../../models/app.js';
import SendUserPasskeyToken from '../../SendUserPasskeyToken.js';

const schema = z.object({
  id: zodFields.objectId('Profile ID is required'),
  passkey: z.string('Password is required'),
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

export default resetPassword;
