import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getAccountModel from "../../../../models/Acounts.js";
import getStoreModel from "../../../../models/Store.js";
import JournalSchema from "./journalSchema.js";
import exchangedAmount from "../../../../func/forex.js";
import addLogs from "../../../../services/Logs.js";
import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const base = z.object({
  date: zodFields.date,
  note: z.string().optional(),
  store: zodFields.objectId("Store"),
  journal: z.enum(Enums.journal),
  profile: z.enum(["customer", "supplier", "employee", "shop", "finance"]),
  id: zodFields.objectId("Account id"),
  amount: z.number().min(0),
  description: z.string(),
});
const journalManager = async ({
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

  const { profile, amount, date, note, store, description, id, journal } =
    base.parse(req.body);

  const isStore = await Store.findOne({
    _id: store,
    isDeleted: false,
  }).session(session);
  if (!isStore) {
    throw new Error("Store not found");
  }
  let accountId = id;

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
    journalType: "direct",
    journal,
    profile,
  };

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

  const transaction = await Transaction.create(
    [
      {
        ...createData,
      },
    ],
    { session },
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

export default journalManager;
