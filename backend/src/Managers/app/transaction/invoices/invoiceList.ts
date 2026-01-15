import { ClientSession } from "mongoose";
import getTransactionModel from "../../../../models/Transaction.js";
import { ExpressRequest } from "../../../../types/Express.js";
import InvoiceSchema from "./invoiceSchema.js";
import getAccountModel from "../../../../models/Acounts.js";
import getStoreModel from "../../../../models/Store.js";
import addLogs from "../../../../services/Logs.js";
import TransactionSchema from "../schema.js";

const invoiceList = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const { currency, list, date, store, note, profile } =
    InvoiceSchema.list.parse(req.body);
  const Account = getAccountModel(req.db!);
  const Store = getStoreModel(req.db!);
  const Transaction = getTransactionModel(req.db!);
  // coheck if store exists
  const isStore = await Store.findOne({
    _id: store,
    isDeleted: false,
  }).session(session);
  if (!isStore) {
    throw new Error("Store not found");
  }
  let accountId;
  if (profile === "customer") {
    const { customer } = TransactionSchema.customer.parse(req.body);
    accountId = customer;
  } else {
    const { supplier } = TransactionSchema.supplier.parse(req.body);
    accountId = supplier;
  }
  const isAccount = await Account.findOne({
    _id: accountId,
    profile: profile,
    store: isStore._id,
    isDeleted: false,
  }).session(session);
  if (!isAccount) {
    throw new Error(`${profile} not found`);
  }

  if (isAccount.currency !== currency) {
    throw new Error("Account currency does not match invoice currency");
  }
  // create transaction
  const createData: any = {
    date,
    store: isStore._id,
    currency,
    type: "invoice-list",
    [profile]: {
      _id: isAccount._id,
      name: isAccount.name,
    },
    ref,
    action: "credit",
    note,
    by: req.by!,
    profile,
  };

  const lists = list.map((item) => {
    return {
      ...item,
      total: item.price * item.quantity,
    };
  });
  const amount = lists.reduce((acc, curr) => acc + curr.total, 0);
  createData.amount = amount;
  createData.list = lists;
  const transaction = await Transaction.create([createData], { session });
  const create = transaction[0];
  if (!transaction[0]) {
    throw new Error("Failed to create invoice list transaction");
  }
  // add logs
  await addLogs({
    model: { type: "invoice", _id: create._id },
    data: create,
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });
  return transaction[0];
};

export default invoiceList;
