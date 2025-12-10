import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession, Model } from 'mongoose';

import addLogs from '../../../Logs.js';

import Compare from '../../../../func/compare/index.js';
import { DocumentUser } from '../../../../models/profiles/User.js';
import getAppModel from '../../../../models/app.js';

const schema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
});
const idSchema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});
const updatePhone = async ({
  req,
  Model,
  session,
}: {
  req: ExpressRequest;
  Model: Model<DocumentUser>;
  session: ClientSession;
}) => {
  const { phoneNumber } = schema.parse(req.body);
  const { id } = idSchema.parse(req.params);

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
  const news = {
    phoneNumber,
  };
  const olds = {
    phoneNumber: isExist?.phoneNumber,
  };
  const changed = Compare.compareObjects({ old: olds, new: news });
  if (!changed) {
    throw new Error('No changes to update');
  }
  const update = await Model.findByIdAndUpdate(isExist._id, news, {
    new: true,
    session,
    runValidators: true,
  });
  if (!update) {
    throw new Error('Failed to update phone number');
  }
  await addLogs({
    model: { type: 'user', _id: update._id },
    data: news,
    old: changed.old,
    by: req.by!,
    action: 'update',
    dbName,
    session,
  });
  return update;
};

export default updatePhone;
