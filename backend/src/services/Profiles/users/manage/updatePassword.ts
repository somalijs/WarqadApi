import z from 'zod';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';
import verifyPasswordToken from '../verification/verifyPasswordToken.js';
import getVerificationModel from '../../../../models/verification.js';
import addLogs from '../../../Logs.js';
import { passwordEncryption } from '../../../../func/Encryptions.js';
import zodFields from '../../../../zod/Fields.js';
import getAppModel from '../../../../models/app.js';
import getUserModel from '../../../../models/profiles/User.js';
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string('Password is required'),
  token: z.string('Token is required'),
  app: zodFields.objectId('App Id'),
});
const updatePassword = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { password, app } = schema.parse(req.body);
  const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
  if (!isApp) {
    throw new Error('App not found');
  }
  if (!isApp.isActive) {
    throw new Error('Your app is not active! Please contact support');
  }
  const dbName = isApp.ref;
  const Model = getUserModel(dbName);
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
    model: { type: 'user', _id: update._id },
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
