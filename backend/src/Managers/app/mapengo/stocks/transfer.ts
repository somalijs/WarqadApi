import { ClientSession } from "mongoose";
import StockSchema from "./schema.js";
import { ExpressRequest } from "../../../../types/Express.js";
import getStoreModel from "../../../../models/Store.js";
import getStocksModel from "../../../../models/Stocks.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getProductModel from "../../../../models/inventory/Product.js";

type Props = {
  req: ExpressRequest;
  session: ClientSession;
  ref: string;
};
const stockTransfer = async ({ req, session, ref }: Props) => {
  const { from, to, stockTransferType, date } = StockSchema.transferBase.parse(
    req.body,
  );
  const { stocks } = StockSchema.stocksItem.parse(req.body);
  const amount = stocks.reduce(
    (acc, stock) => acc + stock.cost * stock.quantity,
    0,
  );
  const Store = getStoreModel(req.db!);
  const Transaction = getTransactionModel(req.db!);
  const Stocks = getStocksModel(req.db!);
  const Product = getProductModel(req.db!);
  const isFrom = await Store.findOne({
    _id: from,
    isDeleted: false,
  });
  if (!isFrom) {
    throw new Error("From Store not found");
  }
  const isTo = await Store.findOne({
    _id: to,
    isDeleted: false,
  });
  if (!isTo) {
    throw new Error("To Store not found");
  }
  // create transaction
  const transactionData = {
    ref,
    type: "mapengo-stock-transfer",
    date,
    action: "credit",
    details: {
      description: `Stock transfer from ${isFrom.name} to ${isTo.name}`,
    },
    currency: isFrom.currency,
    stockTransferType,
    account: {
      _id: isFrom._id,
      name: isFrom.name,
    },
    amount,
    to: {
      _id: isTo._id,
      name: isTo.name,
    },
    from: {
      _id: isFrom._id,
      name: isFrom.name,
    },
    store: isFrom._id,
    by: req.by!,
  };
  const create = await Transaction.create([transactionData], { session });
  if (!create.length) {
    throw new Error("Failed to create transaction");
  }
  const transaction = create[0];

  if (["pressure to item", "bag to item"].includes(stockTransferType)) {
    const stockType =
      stockTransferType === "pressure to item" ? "pressure" : "bag";
    const itemsStocks: any = [];
    const stocksData = await Promise.all(
      stocks.map(async (stock: any, index: number) => {
        const isItem = await Product.findOne({
          _id: stock.product,
          type: stockType,
          isDeleted: false,
        })
          .session(session)
          .lean();

        if (!isItem) {
          throw new Error(`${index + 1}- ${stockType} not found`);
        }
        const stockData: any = {
          type: stockType,
          product: isItem?._id,
          cost: isItem.cost,
          transaction: transaction._id,
          quantity: stockType === "pressure" ? 1 : stock.quantity,
        };
        const itemsDatas = isItem.items.map((item: any) => ({
          ...item,
          quantity: stock.quantity * item.quantity,
        }));
        itemsStocks.push(...itemsDatas);
        stockData.from = isFrom?._id;

        return stockData;
      }),
    );

    const itemsStocksData = await Promise.all(
      itemsStocks.map(async (item: any) => {
        const stockData: any = {
          type: "item",
          product: item.item,
          transaction: transaction._id,
          quantity: item.quantity,
          cost: item.cost,
          to: isTo?._id,
        };

        return stockData;
      }),
    );

    const createStocks = await Stocks.create(stocksData, {
      session,
      ordered: true,
    });

    const createItemsStocks = await Stocks.create(itemsStocksData, {
      session,
      ordered: true,
    });

    if (!createStocks.length || !createItemsStocks.length) {
      throw new Error("Failed to create stocks");
    }

    return { transaction, stocks: createStocks };
  } else if (["item"].includes(stockTransferType)) {
    const stockType = "item";
    const stocksData = await Promise.all(
      stocks.map(async (stock: any, index: number) => {
        const isItem = await Product.findOne({
          _id: stock.product,
          type: "item",
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
        stockData.from = isFrom?._id;
        stockData.to = isTo?._id;
        return stockData;
      }),
    );

    const createStocks = await Stocks.create(stocksData, {
      ordered: true,
      session,
    });

    if (!createStocks.length) {
      throw new Error("Failed to create stocks");
    }
    return { transaction, stocks: createStocks };
  } else if (["bag", "pressure"].includes(stockTransferType)) {
    if (isFrom.type !== "store") {
      throw new Error(
        "From: Bag or pressure transfer can only be done from stores",
      );
    }
    if (isTo.type !== "store") {
      throw new Error(
        "To: Bag or pressure transfer can only be done to stores",
      );
    }
    const stockType = stockTransferType === "pressure" ? "pressure" : "bag";

    const stocksData = await Promise.all(
      stocks.map(async (stock: any, index: number) => {
        const isItem = await Product.findOne({
          _id: stock.product,
          type: stockType,
          isDeleted: false,
        })
          .session(session)
          .lean();

        if (!isItem) {
          throw new Error(`${index + 1}- ${stockType} not found`);
        }
        const stockData: any = {
          type: stockType,
          product: isItem?._id,
          transaction: transaction._id,
          quantity: stockType === "pressure" ? 1 : stock.quantity,
        };

        stockData.from = isFrom?._id;
        stockData.to = isTo?._id;

        return stockData;
      }),
    );
    const createStocks = await Stocks.create(stocksData, {
      session,
      ordered: true,
    });
    if (!createStocks.length) {
      throw new Error("Failed to create stocks");
    }
    return { transaction, stocks: createStocks };
  } else {
    throw new Error("Invalid stock transfer type");
  }
};

export default stockTransfer;
