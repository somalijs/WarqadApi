import mongoose, { ClientSession } from 'mongoose';
import getAppModel from '../../models/app.js';
import { secretKeyManager } from '../../func/Encryptions.js';
import addLogs from '../Logs.js';
import { ExpressRequest } from '../../types/Express.js';
import { dbName } from '../../server.js';
const generateNewSecretKey = async ({
  appId,
  req,
  session,
}: {
  appId: string | mongoose.Types.ObjectId;
  session: ClientSession;
  req: ExpressRequest;
}) => {
  // check if app exist
  const App = getAppModel();
  const isApp = await App.findOne({ _id: appId, isDeleted: false });
  if (!isApp) {
    throw new Error('App not found');
  }
  // generate new secret key
  const newKey = await secretKeyManager.create();
  // update they in db
  const update = await App.findByIdAndUpdate(
    isApp._id,
    {
      key: newKey.encrypted,
    },
    { session, runValidators: true }
  );
  if (!update) {
    throw new Error('Failed to update app secret key');
  }
  // add logs
  await addLogs({
    model: { type: 'app', _id: isApp._id },
    data: {
      action: 'generated new secret key',
    },
    old: {},
    by: req.by!,
    action: 'update',
    dbName,
    session,
  });
  return newKey.key;
};

export default generateNewSecretKey;
