import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import StockAdjustmentSchema from "./StockAdjustmentSchema.js";
import getStoreModel from "../../../../models/Store.js";

import getProductModel from "../../../../models/inventory/Product.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getStocksModel from "../../../../models/Stocks.js";
import addLogs from "../../../../services/Logs.js";

const StockAdjustment = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const { date, store, note, stocks, action } =
    StockAdjustmentSchema.base.parse(req.body);

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

  // Calculate total amount
  const totalAmount = stocks.reduce(
    (acc, item) => acc + item.quantity * item.cost,
    0,
  );

  const transactionData: any = {
    date,
    type: "stock-adjustment",
    ref,
    note,
    store: storeDoc._id,
    amount: totalAmount,
    currency: storeDoc.currency,
    by: req.by!,
    action: action,
    details: {
      description: `Stock ${action === "credit" ? "increase" : "decrease"}`,
    },
  };

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
      const { product, quantity, cost, index } = stock;
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
        cost,
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

export default StockAdjustment;
