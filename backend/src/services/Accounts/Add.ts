import z from 'zod';
import zodFields from '../../zod/Fields.js';
import Enums from '../../func/Enums.js';
import getAccountModel from '../../models/Acounts.js';
import { ExpressRequest } from '../../types/Express.js';
import { ClientSession } from 'mongoose';
import getStoreModel from '../../models/Store.js';
import addLogs from '../Logs.js';
import { ProfileType } from './config.js';
import getUserModel from '../../models/profiles/User.js';

export const baseSchema = z.object({
  name: z
    .string()
    .min(2, 'Name is required')
    .max(20, 'Name must be less than 20 characters')
    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, ' ')),
  phoneNumber: zodFields.phoneNumber.or(z.literal('')).optional(),
  email: zodFields.email.or(z.literal('')).optional(),
  address: z
    .string()
    .min(3, 'Address is required')
    .max(100, 'Address must be less than 100 characters')
    .or(z.literal(''))
    .optional(),
  store: zodFields.objectId('Store Id '),
  //
  guarantor: z.string().or(z.literal('')).optional(),
  creditLimit: z.number().default(0),
  salary: z.number().default(0),
});
export const drawerSchema = z.object({
  keys: z.array(zodFields.objectId('Key Id ')).default([]),
  type: z.string().optional().or(z.literal('')),
});
export const profileSchema = z.object({
  profile: z.enum(Enums.accountProfiles),
});
type Profile = ProfileType;

const addAccount = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { profile } = profileSchema.parse(req.params);
  const { name, phoneNumber, email, address, store } = baseSchema.parse(
    req.body
  );
  // check if store exists
  const isStore = await getStoreModel(req.db!)
    .findOne({
      _id: store,
      isDeleted: false,
    })
    .session(session);
  if (!isStore) {
    throw new Error('Store not found');
  }
  const createData: any = {
    name,
    phoneNumber,
    email,
    address,
    store: isStore._id.toString(),
    profile: profile as Profile,
  };
  if (profile === 'customer') {
    const { guarantor, creditLimit } = baseSchema.parse(req.body);
    createData.guarantor = guarantor;
    createData.creditLimit = creditLimit;
  } else if (profile === 'employee') {
    const { salary, guarantor } = baseSchema.parse(req.body);
    createData.salary = salary;
    createData.guarantor = guarantor;
    // @ts-ignore
  } else if (profile === 'drawer') {
    delete createData.phoneNumber;
    delete createData.email;
    delete createData.address;
    const { keys, type } = drawerSchema.parse(req.body);
    if (keys.length) {
      let keyIds = [];
      for (const key of keys) {
        const isUser = await getUserModel(req.db!)
          .findOne({
            _id: key,
            isDeleted: false,
          })
          .session(session);
        if (!isUser) {
          throw new Error(`User ${key} not found`);
        }
        if (isUser.role !== 'staff') {
          throw new Error(
            `User ${isUser.name} ${isUser.surname} is not a staff`
          );
        }
        keyIds.push(isUser._id);
      }
      createData.keys = keyIds;
    }
    createData.type = type;
  }
  const account = await getAccountModel(req.db!).create(
    [
      {
        ...createData,
        by: req.by!,
      },
    ],
    {
      session,
    }
  );
  if (!account.length) {
    throw new Error('Failed to create account');
  }
  // add logs
  await addLogs({
    model: { type: profile, _id: account[0]._id },
    data: createData,
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: 'create',
    session,
  });
};
export default addAccount;
