import { ClientSession } from "mongoose";
import getTransactionModel from "../../../../models/Transaction.js";
import { ExpressRequest } from "../../../../types/Express.js";
import InvoiceSchema from "./schema.js";
import getAccountModel from "../../../../models/Acounts.js";
import addLogs from "../../../../services/Logs.js";

import TransactionSchema from "../schema.js";
import getDrawerModel from "../../../../models/drawers.js";
import getUnitModel from "../../../../models/Unit.js";
import exchangedAmount from "../../../../func/forex.js";

const houseInvoice = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const { date, type, amount, currency, note, action } =
    InvoiceSchema.houseInvoiceSchema.parse(req.body);

  const transactionData: any = {
    date,
    type: "house-invoice",
    houseInvoice: type,
    ref,
    note,
    currency,
    amount,
    by: req.by!,
    action: action,
    profile: "customer",
  };
  let customerId;
  if (type === "payment") {
    const {
      details: rentDetails,
      unit,
      drawer,
      profile,
    } = InvoiceSchema.houseInvoicePaymentDetails.parse(req.body);
    const isUnit = await getUnitModel(req.db!).findOne({
      _id: unit,
      isDeleted: false,
    });
    if (!isUnit) {
      throw new Error(`Unit account not found`);
    }
    transactionData.details = rentDetails;
    transactionData.details.floor = isUnit.floor;
    transactionData.details.houseNo = isUnit.no;
    customerId = isUnit.customer;
    transactionData.unit = isUnit._id;
    transactionData.houseProfile = profile;
    const isDrawer = await getDrawerModel(req.db!).findOne({
      _id: drawer,
      isDeleted: false,
    });
    if (!isDrawer) {
      throw new Error("Drawer not found");
    }
    if (isUnit.currency !== currency) {
      const { exchangeRate } = TransactionSchema.exchangeRate.parse(req.body);
      transactionData.exchangeRate = exchangeRate;
      transactionData.exchangedAmount = exchangedAmount({
        accountCurrency: isUnit.currency,
        amount,
        exchangeRate,
        transactionCurrency: currency,
      });
      transactionData.exchangedCurrency = isUnit.currency;
    }
    if (action === "debit") {
      transactionData.to = {
        name: isDrawer.name,
        _id: isDrawer._id,
      };
    } else {
      transactionData.from = {
        name: isDrawer.name,
        _id: isDrawer._id,
      };
    }
    if (isDrawer.currency !== currency) {
      throw new Error("Drawer currency does not match transaction currency");
    }
    transactionData.details.description = `Payment (${action === "credit" ? "Paid" : "Received"})`;
  } else if (type === "rent") {
    const { details: rentDetails, unit } =
      InvoiceSchema.houseInvoiceRentDetails.parse(req.body);
    const isTenant = await getUnitModel(req.db!).findOne({
      _id: unit,
      profile: "tenant",
      isDeleted: false,
    });
    if (!isTenant) {
      throw new Error("Tenant not found");
    }
    if (isTenant.endDate) {
      throw new Error("Tenant already moved");
    }
    transactionData.details = rentDetails;
    transactionData.currency = "KSH";
    customerId = isTenant.customer;
    transactionData.unit = isTenant._id;
    transactionData.amount = isTenant.amount;
    transactionData.details.description = `Rent for ${rentDetails.month}/${rentDetails.year} (Floor ${isTenant.floor}, House ${isTenant.no})`;
    transactionData.details.floor = isTenant.floor;
    transactionData.details.houseNo = isTenant.no;
    transactionData.action = "credit";
    transactionData.houseProfile = "tenant";
    // check is any transaction exists
    const isTransaction = await getTransactionModel(req.db!)
      .findOne({
        unit: unit,
        houseInvoice: "rent",
        "details.month": rentDetails.month,
        "details.year": rentDetails.year,
        isDeleted: false,
      })
      .session(session);
    if (isTransaction) {
      throw new Error(
        `Tenant already Invoiced Rent - ${rentDetails.month}/${rentDetails.year}`,
      );
    }
  } else if (type === "journal") {
    const {
      details: rentDetails,
      unit,
      profile,
      description,
    } = InvoiceSchema.houseInvoiceJournalDetails.parse(req.body);
    const isUnit = await getUnitModel(req.db!).findOne({
      _id: unit,
      profile,
      isDeleted: false,
    });
    if (!isUnit) {
      throw new Error(`Unit account not found`);
    }
    transactionData.details = rentDetails;
    transactionData.details.floor = isUnit.floor;
    transactionData.details.houseNo = isUnit.no;
    customerId = isUnit.customer;
    transactionData.unit = isUnit._id;
    transactionData.houseProfile = profile;
    transactionData.details.description = description;
  } else if (type === "sale") {
    const { unit, broker, commission } =
      InvoiceSchema.houseInvoiceSaleDetails.parse(req.body);
    const isTenant = await getUnitModel(req.db!).findOne({
      _id: unit,
      profile: "buyer",
      isDeleted: false,
    });
    if (!isTenant) {
      throw new Error("Buyer not found");
    }
    transactionData.details = {};
    transactionData.currency = isTenant.currency;
    customerId = isTenant.customer;
    transactionData.unit = isTenant._id;
    transactionData.amount = isTenant.amount;
    transactionData.details.description = `Sale floor ${isTenant.floor} house no ${isTenant.no}`;
    transactionData.details.floor = isTenant.floor;
    transactionData.details.houseNo = isTenant.no;
    transactionData.action = "credit";
    transactionData.houseProfile = "buyer";
    if (broker) {
      const isBroker = await getAccountModel(req.db!).findOne({
        _id: broker,
        profile: "broker",
        isDeleted: false,
      });
      if (!isBroker) {
        throw new Error("Broker not found");
      }
      transactionData.broker = {
        name: isBroker.name,
        _id: isBroker._id,
      };
      transactionData.commission = commission;
    }
  } else {
    throw new Error("Invalid house invoice type");
  }
  const isCustomer = await getAccountModel(req.db!)
    .findOne({
      _id: customerId,
      profile: "customer",
      isDeleted: false,
    })
    .session(session);
  if (!isCustomer) {
    throw new Error("Customer not found");
  }
  transactionData.store = isCustomer.store;
  transactionData.customer = {
    name: isCustomer.name,
    _id: isCustomer._id,
  };

  const create = await getTransactionModel(req.db!).create([transactionData], {
    session,
  });
  const transaction = create[0];
  if (!transaction) {
    throw new Error("Failed to create house invoice transaction");
  }
  // add logs
  await addLogs({
    model: { type: "house-invoice", _id: transaction._id },
    data: transaction,
    old: {},
    by: req.by!,
    dbName: req.db!,
    action: "create",
    session: session || null,
  });
  return transaction;
};

export default houseInvoice;
