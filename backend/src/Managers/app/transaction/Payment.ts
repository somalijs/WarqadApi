import { ClientSession, Model as ModelD } from 'mongoose';
import getAccountModel from '../../../models/Acounts.js';
import { ExpressRequest } from '../../../types/Express.js';
import TransactionSchema from './schema.js';
import { TransactionDocument } from '../../../models/Transaction.js';
import addLogs from '../../../services/Logs.js';
import getDrawerModel from '../../../models/drawers.js';

const paymentBox = async ({
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
  const { date, store, currency, amount, action, type, details, note } =
    TransactionSchema.base.parse(req.body);
  const createData: any = {
    date,
    store,
    currency,
    amount,
    action,
    type,
    details,
    ref,
    note,
    by: req.by!,
  };
  if (type === 'payment') {
    const { drawer, profile } = TransactionSchema.payment.parse(req.body);

    createData.profile = profile;
    if (profile === 'customer') {
      const { customer } = TransactionSchema.customer.parse(req.body);
      const isExist = await getAccountModel(req.db!).findOne({
        _id: customer,
        profile: 'customer',
        isDeleted: false,
      });
      if (!isExist) {
        throw new Error(`Customer of id (${customer}) not found`);
      }

      createData.customer = {
        _id: isExist._id,
        name: isExist.name,
      };
    }
    if (profile === 'supplier') {
      const { supplier } = TransactionSchema.supplier.parse(req.body);
      const isExist = await getAccountModel(req.db!).findOne({
        _id: supplier,
        profile: 'supplier',
        isDeleted: false,
      });
      if (!isExist) {
        throw new Error(`Supplier of id (${supplier}) not found`);
      }

      createData.supplier = {
        _id: isExist._id,
        name: isExist.name,
      };
    }
    if (profile === 'employee') {
      const { employee } = TransactionSchema.employee.parse(req.body);
      const isExist = await getAccountModel(req.db!).findOne({
        _id: employee,
        profile: 'employee',
        isDeleted: false,
      });
      if (!isExist) {
        throw new Error(`Employee of id (${employee}) not found`);
      }
      createData.employee = {
        _id: isExist._id,
        name: isExist.name,
      };
    }
    if (profile === 'broker') {
      const { broker } = TransactionSchema.broker.parse(req.body);
      const isExist = await getAccountModel(req.db!).findOne({
        _id: broker,
        profile: 'broker',
        isDeleted: false,
      });
      if (!isExist) {
        throw new Error(`Broker of id (${broker}) not found`);
      }
      createData.broker = {
        _id: isExist._id,
        name: isExist.name,
      };
    }
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
    if (
      (action === 'debit' && ['customer'].includes(profile)) ||
      (action === 'credit' &&
        ['supplier', 'employee', 'broker'].includes(profile))
    ) {
      createData.to = {
        _id: isDrawer._id,
        name: isDrawer.name,
      };
    } else {
      createData.from = {
        _id: isDrawer._id,
        name: isDrawer.name,
      };
    }
  } else {
    throw new Error('Wrong type provided');
  }

  // create payment
  const create = await Model.create([createData], {
    session: session || null,
  });
  if (!create[0]) throw new Error('Payment  failed');
  // add logs
  await addLogs({
    model: { type: 'payment', _id: create[0]._id },
    data: create[0],
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: 'create',
    session: session || null,
  });
  return create[0];
};

export default paymentBox;
