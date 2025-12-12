import getAccountModel from '../../models/Acounts.js';
import { ExpressRequest } from '../../types/Express.js';
import { ClientSession } from 'mongoose';

import addLogs from '../Logs.js';
import { baseSchema, drawerSchema, profileSchema } from './Add.js';
import Compare from '../../func/compare/index.js';

const schema = baseSchema.omit({ store: true });
const editAccount = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { profile } = profileSchema.parse(req.params);
  const data = schema.parse(req.body);
  const { id } = req.params;
  const isExist = await getAccountModel(req.db!)
    .findOne({
      _id: id,
      profile,
      isDeleted: false,
    })
    .session(session);
  if (!isExist) {
    throw new Error('Account not found');
  }
  const news: any = {
    name: data.name,
    phoneNumber: data.phoneNumber,
    email: data.email,
    address: data.address,
  };
  const olds: any = {
    name: isExist.name,
    phoneNumber: isExist.phoneNumber,
    email: isExist.email,
    address: isExist.address,
  };
  if (['customer', 'employee'].includes(profile)) {
    news.guarantor = data.guarantor;
    olds.guarantor = isExist.guarantor;
  }
  if (profile === 'employee') {
    news.salary = data.salary;
    olds.salary = isExist.salary;
  }
  if (profile === 'customer') {
    news.creditLimit = data.creditLimit;
    olds.creditLimit = isExist.creditLimit;
  }
  // @ts-ignore
  if (profile === 'drawer') {
    const { type } = drawerSchema.parse(req.body);

    news.type = type;
    olds.type = isExist.type;
  }
  const details = Compare.compareObjects({ old: olds, new: news });
  if (!details) {
    throw new Error('No changes to update');
  }
  const update = await getAccountModel(req.db!).findByIdAndUpdate(
    id,
    details.new,
    {
      new: true,
      session,
      runValidators: true,
    }
  );
  if (!update) {
    throw new Error('Failed to update account');
  }
  // add logs
  await addLogs({
    model: { type: profile, _id: update._id },
    data: details.new,
    old: details.old,
    by: req.by!,
    dbName: req.db!,
    action: 'update',
    session,
  });
  return update;
};
export default editAccount;
