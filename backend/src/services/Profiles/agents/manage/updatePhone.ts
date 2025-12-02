import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';
import getAgentModel from '../../../../models/profiles/Agent.js';
import addLogs from '../../../Logs.js';
import { dbName } from '../../../../server.js';

import Compare from '../../../../func/compare/index.js';

const schema = zodFields.phone;
const idSchema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});
const updatePhone = async ({
  req,

  session,
}: {
  req: ExpressRequest;

  session: ClientSession;
}) => {
  const Model = getAgentModel();
  const { dialCode, number } = schema.parse(req.body);
  const { id } = idSchema.parse(req.params);

  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`Agent not found`);
  }

  const news = {
    dialCode,
    number,
  };
  const olds = {
    dialCode: isExist.phone?.dialCode,
    number: isExist.phone?.number,
  };
  const changed = Compare.compareObjects({ old: olds, new: news });
  if (!changed) {
    throw new Error('No changes to update');
  }
  const update = await Model.findByIdAndUpdate(
    isExist._id,
    {
      phone: news,
    },
    {
      new: true,
      session,
      runValidators: true,
    }
  );
  if (!update) {
    throw new Error('Failed to update phone number');
  }
  await addLogs({
    model: { type: 'agent', _id: update._id },
    data: {
      phone: changed.new,
    },
    old: {
      phone: changed.old,
    },
    by: req.by!,
    action: 'update',
    dbName,
    session,
  });
  return update;
};

export default updatePhone;
