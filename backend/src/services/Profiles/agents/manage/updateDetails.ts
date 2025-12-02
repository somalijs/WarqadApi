import { ClientSession } from 'mongoose';
import getAgentModel from '../../../../models/profiles/Agent.js';
import { ExpressRequest } from '../../../../types/Express.js';
import zodFields from '../../../../zod/Fields.js';
import z from 'zod';
import Compare from '../../../../func/compare/index.js';
import { dbName } from '../../../../server.js';
import addLogs from '../../../Logs.js';

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
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { name, surname, role, sex } = schema.parse(req.body);
  const { id } = idSchema.parse(req.params);
  const Model = getAgentModel();
  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`Agent not found`);
  }
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
    model: { type: 'agent', _id: update._id },
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
