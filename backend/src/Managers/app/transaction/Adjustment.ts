import { ClientSession, Model as ModelD } from 'mongoose';
import getAccountModel from '../../../models/Acounts.js';
import { ExpressRequest } from '../../../types/Express.js';
import TransactionSchema from './schema.js';
import { TransactionDocument } from '../../../models/Transaction.js';
import addLogs from '../../../services/Logs.js';

const adjustmentBox = async ({
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
  if (type === 'adjustment') {
    const { adjustmentType } = TransactionSchema.adjustment.parse(req.body);
    createData.adjustmentType = adjustmentType;
    if (adjustmentType === 'customer-broker-invoice') {
      const { broker, customer, commission } = TransactionSchema.CB.parse(
        req.body
      );

      if (action === 'credit' && broker) {
        // check if broker exists
        const isBroker = await getAccountModel(req.db!).findOne({
          _id: broker,
          profile: 'broker',
          isDeleted: false,
        });
        if (!isBroker) throw new Error(`Broker of id (${broker}) not found`);
        createData.commission = commission || 0;
        createData.broker = { _id: isBroker._id, name: isBroker.name };
      }
      // check if customer exists
      const isCustomer = await getAccountModel(req.db!).findOne({
        _id: customer,
        profile: 'customer',
        isDeleted: false,
      });
      if (!isCustomer)
        throw new Error(`Customer of id (${customer}) not found`);

      createData.customer = { _id: isCustomer._id, name: isCustomer.name };
    }
    if (adjustmentType === 'broker-invoice') {
      const { broker } = TransactionSchema.broker.parse(req.body);

      // check if broker exists
      const isBroker = await getAccountModel(req.db!).findOne({
        _id: broker,
        profile: 'broker',
        isDeleted: false,
      });
      if (!isBroker) throw new Error(`Broker of id (${broker}) not found`);
      createData.broker = { _id: isBroker._id, name: isBroker.name };
    }
    if (adjustmentType === 'supplier-invoice') {
      const { supplier } = TransactionSchema.supplier.parse(req.body);
      const isSupplier = await getAccountModel(req.db!).findOne({
        _id: supplier,
        profile: 'supplier',
        isDeleted: false,
      });
      if (!isSupplier) {
        throw new Error(`Supplier of id (${supplier}) not found`);
      }
      createData.supplier = { _id: isSupplier._id, name: isSupplier.name };
    }
    if (adjustmentType === 'employee-invoice') {
      const { employee } = TransactionSchema.employee.parse(req.body);
      const isEmployee = await getAccountModel(req.db!).findOne({
        _id: employee,
        profile: 'employee',
        isDeleted: false,
      });
      if (!isEmployee) {
        throw new Error(`Employee of id (${employee}) not found`);
      }
      createData.employee = { _id: isEmployee._id, name: isEmployee.name };
    }
  }

  // create adjustment
  const create = await Model.create([createData], {
    session: session || null,
  });
  if (!create[0]) throw new Error('Adjustment  failed');
  // add logs
  await addLogs({
    model: { type: 'adjustment', _id: create[0]._id },
    data: create[0],
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: 'create',
    session: session || null,
  });
  return create[0];
};

export default adjustmentBox;
