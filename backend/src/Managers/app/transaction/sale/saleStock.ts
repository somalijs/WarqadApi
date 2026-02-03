import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import saleSchema from "./saleSchema.js";
import getStoreModel from "../../../../models/Store.js";
import getAccountModel from "../../../../models/Acounts.js";
import getProductModel from "../../../../models/inventory/Product.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getStocksModel from "../../../../models/Stocks.js";
import addLogs from "../../../../services/Logs.js";
import TransactionSchema from "../schema.js";
import exchangedAmount from "../../../../func/forex.js";

const saleStock = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const { date, store, profile, note, stocks } = saleSchema.stockSale.parse(
    req.body,
  );

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
  let accountId;
  if (profile === "customer") {
    const { customer } = TransactionSchema.customer.parse(req.body);
    accountId = customer;
  } else {
    const { shop } = TransactionSchema.shop.parse(req.body);
    accountId = shop;
  }
  // check if supplier is exists
  const accountDoc = await getAccountModel(req.db!)
    .findOne({
      _id: accountId,
      profile: profile,
      store: storeDoc._id,

      isDeleted: false,
    })
    .session(session);
  if (!accountDoc) {
    throw new Error(`${profile} not found`);
  }

  // Calculate total amount
  const totalAmount = stocks.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0,
  );

  const transactionData: any = {
    date,
    type: "sale",
    sale: "stock-sale",
    ref,
    note,
    store: storeDoc._id,
    amount: totalAmount,
    currency: storeDoc.currency,
    [profile]: {
      name: accountDoc.name,
      _id: accountDoc._id,
    },
    profile,
    by: req.by!,
    action: "credit",
    details: {
      description: `Sale Invoice`,
    },
  };
  if (accountDoc.currency !== storeDoc.currency) {
    const { exchangeRate } = TransactionSchema.exchangeRate.parse(req.body);
    const exAmount = exchangedAmount({
      amount: totalAmount,
      accountCurrency: accountDoc.currency!,
      exchangeRate: exchangeRate,
      transactionCurrency: storeDoc.currency!,
      round: false,
    });
    transactionData.exchangedAmount = exAmount;
    transactionData.exchangedCurrency = storeDoc.currency;
    transactionData.exchangeRate = exchangeRate;
  }
  const createdTransactions = await getTransactionModel(req.db!).create(
    [transactionData],
    {
      session,
    },
  );
  const transaction = createdTransactions[0];
  if (!transaction) {
    throw new Error("Transaction not created");
  }

  // validate stocks
  const stocksToCreate = await Promise.all(
    stocks.map(async (stock) => {
      const { product, quantity, price, index } = stock;
      const productDoc = await getProductModel(req.db!)
        .findOne({
          _id: product,
          store: storeDoc._id,
          isDeleted: false,
        })
        .session(session);

      if (!productDoc) {
        throw new Error(`Product not found at index ${index}`);
      }

      return {
        product: productDoc._id,
        quantity,
        cost: productDoc.cost,
        sell: price,
        transaction: transaction._id,
      };
    }),
  );

  const createdStocks = await getStocksModel(req.db!).create(stocksToCreate, {
    session,
    ordered: true,
  });

  if (!createdStocks.length) {
    throw new Error("Failed to create stocks");
  }

  // add logs
  await addLogs({
    model: { type: "transaction", _id: transaction._id },
    data: {
      ...transactionData,
      stocks: createdStocks,
    },
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });
};

export default saleStock;
