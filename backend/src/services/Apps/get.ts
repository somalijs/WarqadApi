import mongoose from 'mongoose';
import { ExpressRequest } from '../../types/Express.js';
import getAppModel from '../../models/app.js';
import { secretKeyManager } from '../../func/Encryptions.js';
// Returns list or single app when query.id is provided
const getApps = async ({ req }: { req: ExpressRequest }) => {
  const Model = getAppModel();
  const { id, select, query } = req.query as {
    id?: string;
    select?: string;
    query?: string;
  };

  const match: Record<string, unknown> = {};
  if (id) match._id = new mongoose.Types.ObjectId(id);
  console.log(id);
  if (query) {
    match.name = { $regex: query.toLowerCase(), $options: 'i' };
  }

  const find = await Model.aggregate([
    { $match: match },
    {
      $addFields: {
        status: {
          $cond: {
            if: { $eq: ['$isActive', true] },
            then: 'active',
            else: 'inactive',
          },
        },
      },
    },
  ]);

  let resData: any = find;
  if (select) {
    resData = resData.map((item: any) => ({
      label: `${item.name}`,
      value: item._id,
      status: item.status,
    }));
  }

  if (!resData.length) {
    throw new Error(id ? 'App not found' : 'No apps found');
  }
  return id ? resData[0] : resData;
};

export const getSecretkey = async ({ appId }: { appId: string }) => {
  const App = getAppModel();
  const isApp = await App.findOne({ _id: appId, isDeleted: false });
  if (!isApp) {
    throw new Error('App not found');
  }
  if (!isApp.key) {
    throw new Error('Secret key not found');
  }
  const revealkey = secretKeyManager.reveal(isApp.key!);
  return revealkey;
};

export default getApps;
