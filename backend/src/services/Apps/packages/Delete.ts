import { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../../types/Express.js';

import addLogs from '../../Logs.js';
import getPackageModel from '../../../models/Packages.js';

const deletePackage = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { id } = req.params;
  //
  const isExist = await getPackageModel(req.db!).findOne({
    _id: id,
    isDeleted: false,
  });
  if (!isExist) {
    throw new Error('Package not found');
  }
  if (isExist.isDeleted) {
    throw new Error('Package already deleted');
  }
  const replace = await getPackageModel(req.db!).findOneAndUpdate(
    { _id: isExist._id }, // filter
    {
      isDeleted: true,
    },
    {
      new: true, // return the replaced document
      runValidators: true,
      session, // if using a transaction
    }
  );
  if (!replace) {
    throw new Error('Failed to update package');
  }
  // add logs for create action
  await addLogs({
    model: { type: 'package', _id: replace._id },
    data: replace,
    old: isExist,
    by: req.by!,
    action: 'update',
    dbName: req.db!,
    session,
  });

  return {
    message: 'Package deleted successfully',
    data: replace,
  };
};

export default deletePackage;
