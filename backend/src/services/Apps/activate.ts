import z from 'zod';
import { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../types/Express.js';
import addLogs from '../Logs.js';

import zodFields from '../../zod/Fields.js';
import getAppModel from '../../models/app.js';
import { dbName } from '../../server.js';
const paramsSchema = z.object({
  id: zodFields.objectId('App ID is required'),
});

async function activateApp({
  req,

  session,
}: {
  req: ExpressRequest;

  session: ClientSession;
}) {
  const Model = getAppModel();
  const { id } = paramsSchema.parse(req.params);

  const current = await Model.findById(id).session(session);
  if (!current) {
    throw new Error('App not found');
  }

  const updated = await Model.findByIdAndUpdate(
    current._id,
    { isActive: !current.isActive },
    { new: true, session, runValidators: true }
  );
  if (!updated) {
    throw new Error(
      `Failed to ${current.isActive ? 'deactivate' : 'activate'} app`
    );
  }

  await addLogs({
    model: { type: 'app', _id: updated._id },
    data: { isActive: !current.isActive },
    old: { isActive: current.isActive },
    by: req.by!,
    action: 'update',
    session,
    dbName,
  });

  return `${updated.name} ${
    updated.isActive ? 'activated' : 'deactivated'
  } successfully`;
}

export default activateApp;
