import { ClientSession, Model as ModelD } from "mongoose";
import { ExpressRequest } from "../../../types/Express.js";
import TransactionSchema from "./schema.js";
import { TransactionDocument } from "../../../models/Transaction.js";
import addLogs from "../../../services/Logs.js";
import getDrawerModel from "../../../models/drawers.js";
import exchangedAmount from "../../../func/forex.js";

const MoneyTransfer = async ({
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
  const MoneyTransferSchema = TransactionSchema.base.omit({
    currency: true,
    action: true,
  });
  const { date, store, amount, type, note } = MoneyTransferSchema.parse(
    req.body,
  );
  const createData: any = {
    date,
    store,
    amount,
    action: "credit",
    type,
    ref,
    note,
    by: req.by!,
  };
  if (type === "money-transfer") {
    const { from, to } = TransactionSchema.moneyTransfer.parse(req.body);

    const isFrom = await getDrawerModel(req.db!).findOne({
      _id: from,
      // store: store,
      isDeleted: false,
    });
    if (!isFrom) throw new Error(`Drawer of id (${from}) not found`);

    const isTo = await getDrawerModel(req.db!).findOne({
      _id: to,
      // store: store,
      isDeleted: false,
    });
    if (!isTo) throw new Error(`Drawer of id (${to}) not found`);

    createData.from = {
      _id: isFrom._id,
      name: isFrom.name,
    };
    createData.currency = isFrom.currency;
    createData.to = {
      _id: isTo._id,
      name: isTo.name,
    };
    if (isFrom.currency !== isTo.currency) {
      const { exchangeRate } = TransactionSchema.exchangeRate.parse(req.body);
      createData.exchangeRate = exchangeRate;
      createData.exchangedAmount = exchangedAmount({
        amount,
        exchangeRate,
        transactionCurrency: isFrom.currency,
        accountCurrency: isTo.currency,
      });
    }
    createData.details = {
      description: `M-Transfer from (${isFrom.name} - ${isFrom.currency} ) to (${isTo.name} - ${isTo.currency})`,
      month: new Date(date).getMonth() + 1,
      year: new Date(date).getFullYear(),
    };
  } else {
    throw new Error("Wrong type provided");
  }

  // create money transfer
  const create = await Model.create([createData], {
    session: session || null,
  });
  if (!create[0]) throw new Error("Money transfer failed");
  // add logs
  await addLogs({
    model: { type: "money-transfer", _id: create[0]._id },
    data: create[0],
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });
  return create[0];
};

export default MoneyTransfer;
