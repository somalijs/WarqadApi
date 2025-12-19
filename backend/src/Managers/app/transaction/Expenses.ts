import { ClientSession, Model as ModelD } from 'mongoose';
import { ExpressRequest } from '../../../types/Express.js';
import TransactionSchema from './schema.js';
import { TransactionDocument } from '../../../models/Transaction.js';
import addLogs from '../../../services/Logs.js';
import getDrawerModel from '../../../models/drawers.js';

const expensesBox = async ({
  req,
  ref,
  Model,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  Model: ModelD<TransactionDocument>;
  session?: ClientSession;
}) => {
  const ExpensesSchema = TransactionSchema.base.omit({
    action: true,
  });
  const { date, store, currency, amount, type, details, note } =
    ExpensesSchema.parse(req.body);
  const createData: any = {
    date,
    store,
    currency,
    amount,
    action: 'debit',
    type,
    details,
    ref,
    note,
    by: req.by!,
  };
  if (type === 'expenses') {
    const { drawer } = TransactionSchema.expenses.parse(req.body);
    const isDrawer = await getDrawerModel(req.db!).findOne({
      _id: drawer,
      isDeleted: false,
    });
    if (!isDrawer) throw new Error(`Drawer of id (${drawer}) not found`);
    if (isDrawer.currency !== currency) {
      throw new Error(
        `Drawer currency (${isDrawer.currency}) does not match transaction currency (${currency})`
      );
    }
    createData.from = {
      _id: isDrawer._id,
      name: isDrawer.name,
    };
  } else {
    throw new Error('Wrong type provided');
  }

  // create Expenses
  const create = await Model.create([createData], {
    session: session || null,
  });
  if (!create[0]) throw new Error('Expenses  failed');
  // add logs
  await addLogs({
    model: { type: 'expenses', _id: create[0]._id },
    data: create[0],
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: 'create',
    session: session || null,
  });
  return create[0];
};

export default expensesBox;
