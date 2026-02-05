import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import getTransactionModel from "../../../../models/Transaction.js";
import paymentSchema from "./paymentSchema.js";
import TransactionSchema from "../schema.js";
import getAccountModel from "../../../../models/Acounts.js";
import getStoreModel from "../../../../models/Store.js";
import getDrawerModel from "../../../../models/drawers.js";
import exchangedAmount from "../../../../func/forex.js";
import addLogs from "../../../../services/Logs.js";

const Payment = async ({
  req,
  ref,

  session,
}: {
  req: ExpressRequest;
  ref: string;

  session?: ClientSession;
}) => {
  const Model = getTransactionModel(req.db!);
  const Account = getAccountModel(req.db!);
  const Drawer = getDrawerModel(req.db!);
  const { date, store, currency, amount, action, profile, note, drawer } =
    paymentSchema.base.parse(req.body);
  // check if store is exist
  const storeDoc = await getStoreModel(req.db!).findOne({
    _id: store,
    isDeleted: false,
  });
  if (!storeDoc) {
    throw new Error(`Store of id (${store}) not found`);
  }
  // check if account exits
  let accountId;
  switch (profile) {
    case "customer":
      const { customer } = TransactionSchema.customer.parse(req.body);
      accountId = customer;
      break;
    case "supplier":
      const { supplier } = TransactionSchema.supplier.parse(req.body);
      accountId = supplier;
      break;
    case "employee":
      const { employee } = TransactionSchema.employee.parse(req.body);
      accountId = employee;
      break;
    case "shop":
      const { shop } = TransactionSchema.shop.parse(req.body);
      accountId = shop;
      break;
    default:
      throw new Error(`Invalid profile (${profile})`);
  }
  const accountDoc = await Account.findOne({
    _id: accountId,
    profile,
    isDeleted: false,
  });
  if (!accountDoc) {
    throw new Error(`${profile} of id (${accountId}) not found`);
  }
  const createData: any = {
    date,
    store,
    type: "payment",
    currency,
    amount,
    action,
    profile,
    ref,
    note,
    [profile]: {
      _id: accountDoc._id,
      name: accountDoc.name,
    },
    details: {
      description: `Payment ${action === "debit" ? "Received from" : "Paid to"} ${profile}`,
    },
    by: req.by!,
  };
  //
  if (currency !== accountDoc.currency) {
    const { exchangeRate } = TransactionSchema.exchangeRate.parse(req.body);
    createData.exchangeRate = exchangeRate;
    createData.exchangedAmount = exchangedAmount({
      amount,
      exchangeRate,
      accountCurrency: accountDoc.currency!,
      transactionCurrency: currency,
    });
    createData.exchangedCurrency = accountDoc.currency;
  }

  const isDrawer = await Drawer.findOne({
    _id: drawer,
    store: storeDoc._id,
    isDeleted: false,
  });
  if (!isDrawer) throw new Error(`Drawer of id (${drawer}) not found`);
  if (isDrawer.currency !== currency) {
    throw new Error(
      `Drawer currency (${isDrawer.currency}) does not match transaction currency (${currency})`,
    );
  }
  if (
    (action === "debit" && ["customer", "shop"].includes(profile)) ||
    (action === "credit" && ["supplier", "employee"].includes(profile))
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

  // create payment
  const create = await Model.create([createData], {
    session: session || null,
  });
  if (!create[0]) throw new Error("Payment  failed");
  // add logs
  await addLogs({
    model: { type: "payment", _id: create[0]._id },
    data: create[0],
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });
  return create[0];
};

export default Payment;
