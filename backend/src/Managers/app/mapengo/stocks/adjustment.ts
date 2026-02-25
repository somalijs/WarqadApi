import { ClientSession } from "mongoose";
import StockSchema from "./schema.js";
import { ExpressRequest } from "../../../../types/Express.js";

import getStoreModel from "../../../../models/Store.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getProductModel from "../../../../models/inventory/Product.js";
import getStocksModel from "../../../../models/Stocks.js";

type Props = {
  req: ExpressRequest;
  session: ClientSession;
  ref: string;
};
const stockAdjustment = async ({ req, session, ref }: Props) => {
  const { store, date, action, stockType } = StockSchema.base.parse(req.body);
  const { stocks } = StockSchema.stocksItem.parse(req.body);
  const amount = stocks.reduce(
    (acc, stock) => acc + stock.cost * stock.quantity,
    0,
  );
  const Transaction = getTransactionModel(req.db!);
  const Store = getStoreModel(req.db!);
  const Product = getProductModel(req.db!);
  const Stocks = getStocksModel(req.db!);
  const isStore = await Store.findOne({
    _id: store,
    isDeleted: false,
  });
  if (!isStore) {
    throw new Error("Store not found");
  }
  // create transaction
  const transactionData = {
    ref,
    type: "mapengo-stock-adjustment",
    date,
    action,
    amount,
    store: isStore._id,
    details: {
      description: `${stockType}s ${action === "credit" ? "added to" : "removed from"} - ${
        isStore.name
      }`,
    },
    currency: isStore.currency,
    stockType,
    account: {
      _id: isStore._id,
      name: isStore.name,
    },

    by: req.by!,
  };
  const create = await Transaction.create([transactionData], { session });
  if (!create.length) {
    throw new Error("Failed to create transaction");
  }
  const transaction = create[0];

  if (["bag", "pressure"].includes(stockType)) {
    const stocksData: any = await Promise.all(
      stocks.map(async (stock: any, index: number) => {
        const isItem = await Product.findOne({
          _id: stock.product,
          type: stockType,

          isDeleted: false,
        }).session(session);

        if (!isItem) {
          throw new Error(`${index + 1}- ${stockType} not found`);
        }
        const stockData: any = {
          type: stockType,
          product: isItem?._id,
          cost: stock.cost,
          transaction: transaction._id,
          quantity: stockType === "pressure" ? 1 : stock.quantity,
        };
        if (action === "credit") {
          stockData.to = isStore?._id;
        } else {
          stockData.from = isStore?._id;
        }
        return stockData;
      }),
    );
    if (action === "credit") {
      stocksData.to = isStore?._id;
    } else {
      stocksData.from = isStore?._id;
    }
    const createStocks = await Stocks.create(stocksData, {
      session,
      ordered: true,
    });

    if (!createStocks.length) {
      throw new Error("Failed to create stocks");
    }
    return { transaction, stocks: createStocks };
  } else {
    const stocksData: any = await Promise.all(
      stocks.map(async (stock: any, index: number) => {
        const isItem = await Product.findOne({
          _id: stock.product,
          type: stockType,
          isDeleted: false,
        }).session(session);

        if (!isItem) {
          throw new Error(`${index + 1}- ${stockType} not found`);
        }
        const stockData: any = {
          type: stockType,
          product: isItem?._id,
          transaction: transaction._id,
          quantity: stock.quantity,
          cost: stock.cost,
        };
        if (action === "credit") {
          stockData.to = isStore?._id;
        } else {
          stockData.from = isStore?._id;
        }
        return stockData;
      }),
    );
    if (action === "credit") {
      stocksData.to = isStore?._id;
    } else {
      stocksData.from = isStore?._id;
    }
    const createStocks = await Stocks.create(stocksData, {
      ordered: true,
      session,
    });

    if (!createStocks.length) {
      throw new Error("Failed to create stocks");
    }
    return { transaction, stocks: createStocks };
  }
};

export default stockAdjustment;
