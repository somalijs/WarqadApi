import { ClientSession } from 'mongoose';
import { ExpressRequest } from '../../../types/Express.js';
import z from 'zod';

import addLogs from '../../Logs.js';
import getPackageModel from '../../../models/Packages.js';
import zodFields from '../../../zod/Fields.js';

const packageSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required')
    .max(50, 'Name must be less than 20 characters')
    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, ' ')),
  type: z.enum(['umrah', 'hajj', 'hotel']),
  description: z.string().min(3).max(500),
  features: z.array(z.string()).optional(),
  price: z
    .string() // receive as string from form-data
    .transform((val) => Number(val)) // convert to number
    .refine((val) => !isNaN(val), 'Price must be a number'),
  details: z.record(z.any(), z.any()).optional(),
  id: zodFields.objectId('Package ID is required'),
});
const replacePackage = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { name, description, features, price, details, type, id } =
    packageSchema.parse(req.body);
  //
  const isExist = await getPackageModel(req.db!).findOne({
    _id: id,
    isDeleted: false,
  });
  if (!isExist) {
    throw new Error('Package not found');
  }

  const createData = {
    name,
    description,
    features,
    type,
    price,
    details,
  };

  const replace = await getPackageModel(req.db!).findOneAndReplace(
    { _id: id }, // filter
    {
      _id: isExist._id, // keep same _id
      ...createData, // new data
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
    message: 'Package updated successfully',
    data: replace,
  };
};

export default replacePackage;
