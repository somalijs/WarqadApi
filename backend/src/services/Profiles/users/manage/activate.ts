import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession, Model } from 'mongoose';

import addLogs from '../../../Logs.js';

import { DocumentUser } from '../../../../models/profiles/User.js';
import getAppModel from '../../../../models/app.js';

const idSchema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});
const activateUser = async ({
  req,
  session,
  Model,
}: {
  req: ExpressRequest;
  session: ClientSession;
  Model: Model<DocumentUser>;
}) => {
  const { id } = idSchema.parse(req.params);

  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`User not found`);
  }
  if (!isExist.isEmailVerified) {
    throw new Error('First verify the email');
  }
  const isApp = await getAppModel().findOne({
    _id: isExist.app,
    isDeleted: false,
  });
  if (!isApp) {
    throw new Error('App not found');
  }
  const dbName = isApp?.ref;
  const update = await Model.findByIdAndUpdate(
    isExist._id,
    {
      isActive: !isExist.isActive,
    },
    {
      new: true,
      session,
      runValidators: true,
    }
  );
  if (!update) {
    throw new Error(
      `Failed to ${isExist.isActive ? 'deactivate' : 'activate'} profile`
    );
  }
  await addLogs({
    model: { type: 'user', _id: update._id },
    data: {
      isActive: !isExist.isActive,
    },
    old: {
      isActive: isExist.isActive,
    },
    by: req.by!,
    action: 'update',
    dbName: dbName,
    session,
  });
  return update;
};

export default activateUser;
