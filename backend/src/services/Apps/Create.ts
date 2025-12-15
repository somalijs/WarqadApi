import z from 'zod';
import { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../types/Express.js';
import addLogs from '../Logs.js';
import type { AppFields } from '../../models/app.js';
import getAppModel from '../../models/app.js';
import Generators from '../../func/Generators.js';
import { dbName } from '../../server.js';
// Schema to validate incoming creation fields for App
const createSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(30)
    .transform((val) => val.trim().toLowerCase()),
  host: z
    .string()
    .min(2)
    .max(15)
    .transform(
      (val) => val.toLowerCase().replace(/\s+/g, '') // ✅ removes ALL spaces
    ),
  type: z.enum(['private', 'family']),
});

async function createApp({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) {
  const { name, host, type } = createSchema.parse(req.body);
  const Model = getAppModel();
  // ensure duplicate name+type+subType combination doesn't exist
  const exists = await Model.findOne({ name }).session(session);
  if (exists) {
    throw new Error('App already exists with same name and type');
  }
  const refs = await Model.distinct('ref');
  const genRef = await Generators.IdNums({
    ids: refs,
    length: 4,
    prefix: 'AP',
  });
  const createData: AppFields = {
    name,
    ref: genRef,
    isActive: false,
    type,
    by: req.by!,
    host,
  };

  const created = await Model.create([createData], { session });
  if (!created.length) {
    throw new Error('Failed to create app');
  }
  const app = created[0];

  // add logs for create action
  await addLogs({
    model: { type: 'app', _id: app._id },
    data: createData,
    old: {},
    by: req.by!,
    action: 'create',
    dbName,
    session,
  });

  return app;
}

export default createApp;
