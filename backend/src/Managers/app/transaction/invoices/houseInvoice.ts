import { ClientSession } from "mongoose";
import getTransactionModel from "../../../../models/Transaction.js";
import { ExpressRequest } from "../../../../types/Express.js";
import InvoiceSchema from "./schema.js";
import getAccountModel from "../../../../models/Acounts.js";
import addLogs from "../../../../services/Logs.js";

const houseInvoice = async ({
  req,
  ref,
  session,
}: {
  req: ExpressRequest;
  ref: string;
  session: ClientSession;
}) => {
  const { customer, date, type, amount, currency, note } =
    InvoiceSchema.houseInvoiceSchema.parse(req.body);
  let details;
  let broker;
  let commission;
  if (type === "rent") {
    const { details: rentDetails } =
      InvoiceSchema.houseInvoiceRentDetails.parse(req.body);
    details = rentDetails;
  } else {
    const {
      details: saleDetails,
      broker: saleBroker,
      commission: saleCommission,
    } = InvoiceSchema.houseInvoiceSaleDetails.parse(req.body);
    details = saleDetails;
    broker = saleBroker;
    commission = saleCommission;
  }
  // check if customer exist
  const isCustomer = await getAccountModel(req.db!)
    .findOne({
      _id: customer,
      profile: "customer",
      isDeleted: false,
    })
    .session(session);
  if (!isCustomer) {
    throw new Error("Customer not found");
  }

  const transactionData: any = {
    date,
    store: isCustomer.store,
    type: "house-invoice",
    houseInvoice: type,
    ref,
    note,
    details: details,
    customer: {
      name: isCustomer.name,
      _id: isCustomer._id,
    },
    currency,
    amount,
    by: req.by!,
    action: "credit",
    profile: "customer",
  };
  // if broker exists
  if (broker) {
    const isBroker = await getAccountModel(req.db!)
      .findOne({
        _id: broker,
        profile: "broker",
        isDeleted: false,
      })
      .session(session);
    if (!isBroker) {
      throw new Error("Broker not found");
    }
    transactionData.broker = {
      name: isBroker.name,
      _id: isBroker._id,
    };
    transactionData.commission = commission;
  }
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
