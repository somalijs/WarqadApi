import z from 'zod';
import Enums from '../../func/Enums.js';
import getAccountModel from '../../models/Acounts.js';
import { ExpressRequest } from '../../types/Express.js';
import { ClientSession } from 'mongoose';

import addLogs from '../Logs.js';
import { passwordEncryption } from '../../func/Encryptions.js';

export const profileSchema = z.object({
  profile: z.enum(Enums.accountProfiles),
});
const schema = z.object({
  passkey: z.string(),
});
const deleteAccount = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { profile } = profileSchema.parse(req.params);
  const { id } = req.params;
  const { passkey } = schema.parse(req.body);
  const isMatch = await passwordEncryption.compare(passkey, req.password!);
  if (!isMatch) {
    throw new Error('Invalid Credentials');
  }
  const Account = getAccountModel(req.db!);
  const isExist = await Account.findOne({
    _id: id,
    profile,
    isDeleted: false,
  }).session(session);
  if (!isExist) {
    throw new Error('Account not found');
  }
  const deleted = await Account.findByIdAndUpdate(
    isExist._id,
    { isDeleted: true },
    { new: true, session, runValidators: true }
  );
  if (!deleted) {
    throw new Error('Failed to delete account');
  }
  // add logs
  await addLogs({
    model: { type: profile, _id: deleted._id },
    data: deleted,
    old: isExist,
    by: req.by!,
    dbName: req.db!,
    action: 'delete',
    session,
  });
  return deleted;
};
export default deleteAccount;
