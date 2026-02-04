import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import purchaseSchema from "./purchaseSchema.js";
import getStoreModel from "../../../../models/Store.js";
import getAccountModel from "../../../../models/Acounts.js";
import getTransactionModel from "../../../../models/Transaction.js";
import addLogs from "../../../../services/Logs.js";
import TransactionSchema from "../schema.js";
import exchangedAmount from "../../../../func/forex.js";
import getStocksModel from "../../../../models/Stocks.js";
import getProductModel from "../../../../models/inventory/Product.js";

const clearanceStockSupply = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const {
    date,
    store,
    supplier,
    note,
    transaction,
    amount,
    description,
    arrival,
    departure,
  } = purchaseSchema.clearance.parse(req.body);

  // check if store is exists
  const storeDoc = await getStoreModel(req.db!)
    .findOne({
      _id: store,
      isDeleted: false,
    })
    .session(session);
  if (!storeDoc) {
    throw new Error("Store not found");
  }
  const transactionDoc = await getTransactionModel(req.db!)
    .findOne({
      _id: transaction,
      store: storeDoc._id,
      purchase: "stock-supply",
      isDeleted: false,
    })
    .session(session);
  if (!transactionDoc) {
    throw new Error("Transaction not found");
  }
  // check if transaction is already cleared
  const clearedTransaction = await getTransactionModel(req.db!)
    .findOne({
      transaction: transactionDoc._id,
      store: storeDoc._id,
      purchase: "stock-supply-clearance",
      isDeleted: false,
    })
    .session(session);
  if (clearedTransaction) {
    throw new Error("This transaction has clearance");
  }
  // check if supplier is exists
  const supplierDoc = await getAccountModel(req.db!)
    .findOne({
      _id: supplier,
      profile: "supplier",
      supplierType: "clearance",
      store: storeDoc._id,
      isDeleted: false,
    })
    .session(session);
  if (!supplierDoc) {
    throw new Error("Clearance supplier not found");
  }

  const transactionData: any = {
    date,
    type: "purchase",
    purchase: "stock-supply-clearance",
    ref,
    note,
    transaction: transactionDoc._id,
    store: storeDoc._id,
    amount: amount,
    currency: supplierDoc.currency,
    supplier: {
      name: supplierDoc.name,
      _id: supplierDoc._id,
    },
    by: req.by!,
    action: "credit",
    details: { description, departure, arrival },
  };
  let defaultAmount = amount;
  if (supplierDoc.currency !== storeDoc.currency) {
    const { exchangeRate } = TransactionSchema.exchangeRate.parse(req.body);
    const exAmount = exchangedAmount({
      amount: amount,
      accountCurrency: storeDoc.currency!,
      exchangeRate: exchangeRate,
      transactionCurrency: supplierDoc.currency!,
    });
    transactionData.exchangedAmount = exAmount;
    transactionData.exchangedCurrency = storeDoc.currency;
    transactionData.exchangeRate = exchangeRate;
    defaultAmount = exAmount;
  }
  const createdTransactions = await getTransactionModel(req.db!).create(
    [transactionData],
    {
      session,
    },
  );
  const productDocs = await getStocksModel(req.db!)
    .find({ transaction: transactionDoc._id })
    .sort({ _id: 1 }) // optional: ensures order if needed
    .session(session)
    .lean();

  const totalQuantity = productDocs.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  if (totalQuantity === 0) throw new Error("Total quantity is zero");

  const clearanceAmount = defaultAmount / totalQuantity;
  // Update the products with the clearance amount
  for (const product of productDocs) {
    await getProductModel(req.db!).updateOne(
      { _id: product.product },
      { $inc: { cost: clearanceAmount } },
      { session },
    );
  }
  const created = createdTransactions[0];
  if (!created) {
    throw new Error("Transaction not created");
  }

  // add logs
  await addLogs({
    model: { type: "transaction", _id: created._id },
    data: {
      ...transactionData,
    },
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });
};

export default clearanceStockSupply;
