import { ClientSession, Model } from 'mongoose';
import { ExpressRequest } from '../../../../types/Express.js';
import zodFields from '../../../../zod/Fields.js';
import z from 'zod';
import Compare from '../../../../func/compare/index.js';

import addLogs from '../../../Logs.js';
import { DocumentUser } from '../../../../models/profiles/User.js';
import getAppModel from '../../../../models/app.js';

const schema = z.object({
  name: z.string().min(2).max(20),
  surname: z.string().min(2).max(20),
  role: zodFields.role,
  sex: zodFields.sex,
});
const idSchema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});

const updateDetails = async ({
  req,
  Model,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
  Model: Model<DocumentUser>;
}) => {
  const { name, surname, role, sex } = schema.parse(req.body);
  const { id } = idSchema.parse(req.params);

  const isExist = await Model.findOne({ _id: id, isDeleted: false })
  .session(session);
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
    name,
    surname,
    role,
    sex,
  };
  const olds = {
    name: isExist.name,
    surname: isExist.surname,
    role: isExist.role,
    sex: isExist.sex,
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
    throw new Error('Failed to update profile');
  }
  await addLogs({
    model: { type: 'user', _id: update._id },
    data: changed.new,
    old: changed.old,
    by: req.by!,
    dbName: dbName,
    action: 'update',
    session,
  });
  return update;
};

export default updateDetails;
