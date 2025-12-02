import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';
import getAgentModel from '../../../../models/profiles/Agent.js';
import addLogs from '../../../Logs.js';
import { dbName } from '../../../../server.js';

const idSchema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});
const activateProfile = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const Model = getAgentModel();
  const { id } = idSchema.parse(req.params);

  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`Agent not found`);
  }
  if (!isExist.isEmailVerified) {
    throw new Error('First verify the email');
  }

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
    model: { type: 'agent', _id: update._id },
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

export default activateProfile;
