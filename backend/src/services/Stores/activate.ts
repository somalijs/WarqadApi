import z from 'zod';
import { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../types/Express.js';
import addLogs from '../Logs.js';
import zodFields from '../../zod/Fields.js';
import getStoreModel from '../../models/Store.js';
import { dbName } from '../../server.js';
import getAppModel from '../../models/app.js';
const paramsSchema = z.object({
  id: zodFields.objectId('Store ID is required'),
  app: zodFields.objectId('App ID is required'),
});

async function activate({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) {
  const { id, app } = paramsSchema.parse(req.params);

  const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
  if (!isApp) {
    throw new Error('App not found');
  }
  const Model = getStoreModel(isApp.ref);

  const current = await Model.findById(id).session(session);
  if (!current) {
    throw new Error('Store not found');
  }

  const updated = await Model.findByIdAndUpdate(
    current._id,
    { isActive: !current.isActive },
    { new: true, session, runValidators: true }
  );
  if (!updated) {
    throw new Error(
      `Failed to ${current.isActive ? 'deactivate' : 'activate'} store`
    );
  }

  await addLogs({
    model: { type: 'store', _id: updated._id },
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

export default activate;
