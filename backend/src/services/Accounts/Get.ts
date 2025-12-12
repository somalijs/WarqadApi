import mongoose from 'mongoose';
import { ExpressRequest } from '../../types/Express.js';
import z from 'zod';
import Enums from '../../func/Enums.js';
import zodFields from '../../zod/Fields.js';
import getAccountModel from '../../models/Acounts.js';
const profileSchema = z.object({
  profile: z.enum(Enums.accountProfiles),
  store: zodFields.objectId('Store Id ').optional(),
  id: zodFields.objectId('Account Id ').optional(),
  selection: z.enum(['true', 'false']).optional(),
});
const getAccounts = async ({ req }: { req: ExpressRequest }) => {
  const Account = getAccountModel(req.db!);
  const { profile, store, id, selection } = profileSchema.parse(req.query);
  const Stores = req.stores!.map((store) => store._id);
  const matches: any = {
    isDeleted: false,
    profile,
    $and: [
      { store: { $in: Stores } },
      store
        ? { store: new mongoose.Types.ObjectId(store) }
        : { store: { $exists: true } },
    ],
  };
  if (id) {
    matches._id = new mongoose.Types.ObjectId(id);
  }
  const accounts = await Account.aggregate([
    {
      $match: matches,
    },
  ]);
  let resData = accounts;
  if (selection === 'true') {
    resData = accounts.map((account) => ({
      value: account._id,
      label: account.name,
    }));
  }
  if (!resData.length) {
    throw new Error(id ? `Account not found` : `No ${profile} Accounts found`);
  }
  return id ? resData[0] : resData;
};

export default getAccounts;
