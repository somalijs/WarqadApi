import { ClientSession } from "mongoose";
import { ExpressRequest } from "../../../../types/Express.js";
import purchaseSchema from "./purchaseSchema.js";
import getStoreModel from "../../../../models/Store.js";
import getAccountModel from "../../../../models/Acounts.js";
import getProductModel from "../../../../models/inventory/Product.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getStocksModel from "../../../../models/Stocks.js";
import addLogs from "../../../../services/Logs.js";
import TransactionSchema from "../schema.js";
import exchangedAmount from "../../../../func/forex.js";

const stockSupply = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const { ref: isEdit } = req.query;
  const { date, store, supplier, note, stocks } =
    purchaseSchema.stockSupply.parse(req.body);

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

  // check if supplier is exists
  const supplierDoc = await getAccountModel(req.db!)
    .findOne({
      _id: supplier,
      profile: "supplier",
      store: storeDoc._id,
      isDeleted: false,
    })
    .session(session);
  if (!supplierDoc) {
    throw new Error("Supplier not found");
  }

  // Calculate total amount
  const totalAmount = stocks.reduce(
    (acc, item) => acc + item.quantity * item.cost,
    0,
  );

  const transactionData: any = {
    date,
    type: "purchase",
    purchase: "stock-supply",
    ref,
    note,
    store: storeDoc._id,
    amount: totalAmount,
    currency: supplierDoc.currency,
    supplier: {
      name: supplierDoc.name,
      _id: supplierDoc._id,
    },
    by: req.by!,
    action: "credit",
    details: {
      description: `Invoice for stock supply`,
    },
  };
  if (supplierDoc.currency !== storeDoc.currency) {
    const { exchangeRate } = TransactionSchema.exchangeRate.parse(req.body);

    const exAmount = exchangedAmount({
      amount: totalAmount,
      accountCurrency: storeDoc.currency!,
      exchangeRate: exchangeRate,
      transactionCurrency: supplierDoc.currency!,
      round: true,
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
      let newCost = cost;
      if (supplierDoc.currency !== storeDoc.currency) {
        const { exchangeRate } = TransactionSchema.exchangeRate.parse(req.body);
        newCost = exchangedAmount({
          amount: cost,
          accountCurrency: storeDoc.currency!,
          exchangeRate: exchangeRate,
          transactionCurrency: supplierDoc.currency!,
        });
      }
      if (productDoc.cost !== newCost) {
        productDoc.cost = newCost;
        await productDoc.save({ session });
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
  // udpate clearnce if exist
  if (isEdit) {
    const originalTransaction = await getTransactionModel(req.db!)
      .findOne({
        ref: isEdit,
        purchase: "stock-supply",
      })
      .session(session);
    if (!originalTransaction) {
      throw new Error("Original transaction not found");
    }
    const clearanceTransaction = await getTransactionModel(req.db!)
      .findOne({
        transaction: originalTransaction._id,
        purchase: "stock-supply-clearance",
        isDeleted: false,
      })
      .session(session);
    if (clearanceTransaction) {
      clearanceTransaction.transaction = transaction._id;
      await clearanceTransaction.save({ session });
    }
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

export default stockSupply;
