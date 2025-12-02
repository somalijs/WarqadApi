import z from 'zod';
import { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../types/Express.js';
import addLogs from '../Logs.js';
import Compare from '../../func/compare/index.js';

import zodFields from '../../zod/Fields.js';
import getAppModel from '../../models/app.js';
import { dbName } from '../../server.js';
const paramsSchema = z.object({
  id: zodFields.objectId('App ID is required'),
});
const updateSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(15)
    .transform((val) => val.trim().toLowerCase())
    .optional(),
});

async function updateApp({
  req,

  session,
}: {
  req: ExpressRequest;

  session: ClientSession;
}) {
  const Model = getAppModel();
  const { id } = paramsSchema.parse(req.params);
  const updates = updateSchema.parse(req.body);

  const current = await Model.findOne({ _id: id }).session(session);
  if (!current) {
    throw new Error('App not found');
  }

  const news = {
    name: updates.name ?? current.name,
  };
  const olds = {
    name: current.name,
  };
  const changed = Compare.compareObjects({ old: olds, new: news });
  if (!changed) {
    throw new Error('No changes to update');
  }

  const updated = await Model.findByIdAndUpdate(current._id, updates, {
    new: true,
    session,
    runValidators: true,
  });
  if (!updated) {
    throw new Error('Failed to update app');
  }

  await addLogs({
    model: { type: 'app', _id: updated._id },
    data: changed.new,
    old: changed.old,
    by: req.by!,
    action: 'update',
    session,
    dbName,
  });

  return updated;
}

export default updateApp;
