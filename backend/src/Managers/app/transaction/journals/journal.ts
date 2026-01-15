import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getAccountModel from "../../../../models/Acounts.js";
import getStoreModel from "../../../../models/Store.js";
import JournalSchema from "./journalSchema.js";
import TransactionSchema from "../schema.js";
import exchangedAmount from "../../../../func/forex.js";
import addLogs from "../../../../services/Logs.js";

const journalBox = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const Transaction = getTransactionModel(req.db!);
  const Account = getAccountModel(req.db!);
  const Store = getStoreModel(req.db!);

  const { journalType, profile, amount, date, note, store, description } =
    JournalSchema.base.parse(req.body);

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
  } else if (profile === "supplier") {
    const { supplier } = TransactionSchema.supplier.parse(req.body);
    accountId = supplier;
  } else if (profile === "employee") {
    const { employee } = TransactionSchema.employee.parse(req.body);
    accountId = employee;
  } else if (profile === "shop") {
    const { shop } = TransactionSchema.shop.parse(req.body);
    accountId = shop;
  } else {
    throw new Error("Invalid profile type");
  }
  const isAccount = await Account.findOne({
    _id: accountId,
    profile: profile,
    isDeleted: false,
  }).session(session);
  if (!isAccount) {
    throw new Error(`${profile} ${accountId}`);
  }
  if (isAccount.store.toString() !== isStore._id.toString()) {
    throw new Error(`${profile} does not belong to the store`);
  }
  const createData: any = {
    date,
    store: isStore._id,
    type: "journal",
    ref,
    note,
    details: {
      description,
    },
    [profile]: {
      name: isAccount.name,
      _id: isAccount._id,
    },
    amount,
    by: req.by!,
    journalType,
    profile,
  };
  if (journalType === "direct") {
    const { currency, action } = JournalSchema.directJournal.parse(req.body);
    createData.currency = currency;
    createData.action = action;
    if (isAccount.currency !== currency) {
      const { exchangeRate } = JournalSchema.exchangeRate.parse(req.body);
      createData.exchangedAmount = exchangedAmount({
        accountCurrency: isAccount.currency!,
        amount,
        exchangeRate,
        transactionCurrency: currency!,
      });
      createData.exchangeRate = exchangeRate;
      createData.exchangedCurrency = isAccount.currency;
    }
  } else {
    const { sarif, fee } = JournalSchema.sarifJournal.parse(req.body);
    const isSarif = await Account.findOne({
      _id: sarif,
      supplierType: "sarif",
      isDeleted: false,
    }).session(session);
    if (!isSarif) {
      throw new Error("Sarifle account not found");
    }
    createData.sarif = {
      name: isSarif.name,
      _id: isSarif._id,
    };
    createData.currency = isSarif.currency;
    createData.action = "debit";
    if (isAccount.currency !== isSarif.currency) {
      const { exchangeRate } = JournalSchema.exchangeRate.parse(req.body);
      createData.exchangedAmount = exchangedAmount({
        accountCurrency: isAccount.currency!,
        amount,
        exchangeRate,
        transactionCurrency: isSarif.currency!,
      });
      createData.exchangeRate = exchangeRate;
      createData.exchangedCurrency = isAccount.currency;
    }
    if (fee && fee > 0) {
      createData.fee = fee;
      const sarifAmount = amount + (fee! / 100) * amount;
      createData.sarifAmount = sarifAmount;
    } else {
      createData.sarifAmount = amount;
    }
    createData.details = {
      description: `${description}`,
    };
  }

  const transaction = await Transaction.create(
    [
      {
        ...createData,
      },
    ],
    { session }
  );
  const create = transaction[0];
  if (!create) {
    throw new Error("Failed to create journal transaction");
  }
  // add logs
  await addLogs({
    model: { type: "journal", _id: create._id },
    data: create,
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });
  return create;
};

export default journalBox;
