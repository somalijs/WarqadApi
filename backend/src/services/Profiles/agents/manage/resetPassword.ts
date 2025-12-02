import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';
import getAgentModel from '../../../../models/profiles/Agent.js';
import { passwordEncryption } from '../../../../func/Encryptions.js';
import { dbName } from '../../../../server.js';
import SendPasskeyToken from '../../SendpasskeyToken.js';
import addLogs from '../../../Logs.js';

const schema = z.object({
  id: zodFields.objectId('Profile ID is required'),
  passkey: z.string('Password is required'),
});

const resetPassword = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const Model = getAgentModel();
  const { id, passkey } = schema.parse(req.body);
  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`Agent not found`);
  }
  const confrimPasskey = await passwordEncryption.compare(
    passkey,
    req.password!
  );
  if (!confrimPasskey) {
    throw new Error('Invalid Admin Passkey');
  }
  // send passkey to email
  // sned password reset token
  await SendPasskeyToken({
    id: isExist._id,
    Model,
    profile: 'agent',
    session,
    dbName,
  });
  await addLogs({
    model: { type: 'agent', _id: isExist._id },
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
