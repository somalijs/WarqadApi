import mongoose from 'mongoose';
import getLogsModel, { LogsTypes } from '../models/Logs.js';

type props = LogsTypes & {
  session?: mongoose.ClientSession | null;
  dbName?: string;
};
async function addLogs(datas: props) {
  const { model, data, old, by, action, session, dbName } = datas;
  const Logs = getLogsModel(dbName!);
  const create = await Logs.create([{ model, data, old, by, action }], {
    session,
  });
  if (!create.length) {
    throw new Error('Failed to create logs');
  }
  return create[0];
}

export default addLogs;
