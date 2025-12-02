import z from 'zod';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';
import verifyPasswordToken from '../verification/verifyPasswordToken.js';
import getVerificationModel from '../../../../models/verification.js';
import addLogs from '../../../Logs.js';
import { passwordEncryption } from '../../../../func/Encryptions.js';
import getAgentModel from '../../../../models/profiles/Agent.js';
import { dbName } from '../../../../server.js';
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string('Password is required'),
  token: z.string('Token is required'),
});
const updatePassword = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const Model = getAgentModel();
  const { password } = schema.parse(req.body);
  // verify
  const isVerified = await verifyPasswordToken({
    req,
    session,
  });
  const updates = {
    password,
  };
  if (isVerified.oldPassword) {
    // check if password is the same as the old password
    const isSamePassword = await passwordEncryption.compare(
      password,
      isVerified.oldPassword!
    );
    if (isSamePassword) {
      throw new Error('New password cannot be the same as the old password');
    }
  }
  const update = await Model.findByIdAndUpdate(isVerified.id, updates, {
    new: true,
    session,
    runValidators: true,
  });
  if (!update) {
    throw new Error('Unable to update password');
  }
  // use the token
  await getVerificationModel(dbName).findByIdAndUpdate(
    isVerified.tokenId,
    {
      isUsed: true,
    },
    {
      new: true,
      session,
      runValidators: true,
    }
  );
  // add logs
  await addLogs({
    model: { type: 'agent', _id: update._id },
    data: {
      password: `password updated`,
    },
    by: {
      _id: update._id,
      name: `${update.name} ${update.surname}`,
    },
    action: 'update',
    dbName,
    session,
  });
  return update;
};

export default updatePassword;
