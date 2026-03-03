import { ClientSession } from "mongoose";
import StockSchema from "./schema.js";
import { ExpressRequest } from "../../../../types/Express.js";
import getStoreModel from "../../../../models/Store.js";
import getTransactionModel from "../../../../models/Transaction.js";
import getProductModel from "../../../../models/inventory/Product.js";
import getStocksModel from "../../../../models/Stocks.js";
import getDrawerModel from "../../../../models/drawers.js";
import exchangedAmount from "../../../../func/forex.js";
import getAccountModel from "../../../../models/Acounts.js";

type Props = {
  req: ExpressRequest;
  session: ClientSession;
  ref: string;
};
const SaleStock = async ({ req, session, ref }: Props) => {
  const { store, date, saleType, exchangeRate } = StockSchema.saleBase.parse(
    req.body,
  );
  const { stocks } = StockSchema.saleStocks.parse(req.body);
  const amount = stocks.reduce(
    (acc, stock) => acc + stock.quantity * stock.sell,
    0,
  );
  const Store = getStoreModel(req.db!);
  const Transaction = getTransactionModel(req.db!);
  const Product = getProductModel(req.db!);
  const Account = getAccountModel(req.db!);
  const Drawer = getDrawerModel(req.db!);
  const Stocks = getStocksModel(req.db!);
  const isFrom = await Store.findOne({
    _id: store,
    isDeleted: false,
  });
  if (!isFrom) {
    throw new Error("Shop not found");
  }
  if (isFrom.type === "store") {
    throw new Error("Only Shops can have sale transaction");
  }
  // create transaction
  const transactionData: any = {
    ref,
    type: "mapengo-stock-sale",
    date,
    amount,
    action: "debit",
    store: isFrom._id,
    details: {
      description: `sale from ${isFrom.name}`,
    },
    exchangeRate,
    saleType,
    stockType: "item",
    currency: isFrom.currency,
    account: {
      _id: isFrom._id,
      name: isFrom.name,
    },
    from: {
      _id: isFrom._id,
      name: isFrom.name,
    },
    by: req.by!,
  };

  if (saleType === "cash") {
    const { currency } = StockSchema.cashSale.parse(req.body);
    // check account
    const getDrawer = await Drawer.findOne({
      store: isFrom._id,
      currency,
      isDeleted: false,
    });
    if (!getDrawer) {
      throw new Error(`Shop ${isFrom.name} has no drawer for (${currency})`);
    }
    if (exchangeRate && exchangeRate > 0) {
      transactionData.exchangedAmount = exchangedAmount({
        amount,
        exchangeRate,
        accountCurrency: getDrawer.currency!,
        transactionCurrency: "TZS",
      });
    }
    transactionData.to = {
      _id: getDrawer._id,
      name: getDrawer.name,
    };
  } else {
    const { customer } = StockSchema.invoiceSale.parse(req.body);
    const getCustomer = await Account.findOne({
      _id: customer,
      profile: "customer",
      store: isFrom._id,
      isDeleted: false,
    });
    if (!getCustomer) {
      throw new Error("Customer not found");
    }
    if (exchangeRate && exchangeRate > 0) {
      transactionData.exchangedAmount = exchangedAmount({
        amount,
        exchangeRate,
        accountCurrency: getCustomer.currency!,
        transactionCurrency: "TZS",
      });
    }
    transactionData.profile = getCustomer.profile;
    transactionData.account = {
      _id: getCustomer._id,
      name: getCustomer.name,
      profile: getCustomer.profile,
    };
    transactionData.customer = {
      _id: getCustomer._id,
      name: getCustomer.name,
      profile: getCustomer.profile,
    };
    transactionData.action = "credit";
  }
  const create = await Transaction.create([transactionData], { session });
  if (!create.length) {
    throw new Error("Failed to create transaction");
  }
  const transaction = create[0];

  const stockType = "item";
  const stocksData = await Promise.all(
    stocks.map(async (stock: any, index: number) => {
      const isItem = await Product.findOne({
        _id: stock.product,
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
        cost: isItem.cost,
        sell: stock.sell,
      };
      stockData.from = isFrom?._id;

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
};

export default SaleStock;
