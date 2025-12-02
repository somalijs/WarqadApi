import z from 'zod';
import getUserModel from '../../../../models/profiles/User.js';
import { ExpressRequest } from '../../../../types/Express.js';
import zodFields from '../../../../zod/Fields.js';
import getStoreModel from '../../../../models/Store.js';
import { ClientSession } from 'mongoose';
import addLogs from '../../../Logs.js';

const idSchema = z.object({
  id: zodFields.objectId('User ID is required'),
  store: zodFields.objectId('Store ID is required'),
  action: z.enum(['add', 'remove']),
});

const StoreAccess = async ({
  req,
  dbName,
  session,
}: {
  req: ExpressRequest;
  dbName: string;
  session: ClientSession;
}) => {
  const { id, store, action } = idSchema.parse(req.body);

  const UserModel = getUserModel(dbName);
  const StoreModel = getStoreModel(dbName);

  const isUser = await UserModel.findOne({ _id: id, isDeleted: false }, null, {
    session,
  });
  if (!isUser) {
    throw new Error('User not found');
  }
  if (isUser?.role === 'admin') {
    throw new Error('Admin cannot be given store access');
  }
  const isStore = await StoreModel.findOne({
    _id: store,
    isDeleted: false,
  }).session(session);
  if (!isStore) {
    throw new Error('Store not found');
  }

  const updateQuery =
    action === 'add'
      ? { $addToSet: { stores: store } }
      : { $pull: { stores: store } };

  const updated = await UserModel.findOneAndUpdate({ _id: id }, updateQuery, {
    runValidators: true,
    new: true,
    session,
  });

  if (!updated) {
    throw new Error(
      action === 'add'
        ? 'Store already exists or update failed'
        : 'Store not found or update failed'
    );
  }
  // add log
  await addLogs({
    model: { type: 'user', _id: updated._id },
    data: { stores: updated.stores },
    old: { stores: isUser.stores },
    by: req.by!,
    action: 'update',
    session,
  });
  return {
    success: true,
    data: updated,
    message: `Store access ${
      action === 'add' ? 'added' : 'removed'
    } successfully`,
  };
};

export default StoreAccess;
