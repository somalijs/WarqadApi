import { ClientSession } from "mongoose";
import getTransactionModel from "../../../../models/Transaction.js";
import { ExpressRequest } from "../../../../types/Express.js";
import InvoiceSchema from "./schema.js";
import getAccountModel from "../../../../models/Acounts.js";
import addLogs from "../../../../services/Logs.js";
import getTenantModel from "../../../../models/Tenant.js";
import TransactionSchema from "../schema.js";
import getDrawerModel from "../../../../models/drawers.js";

const houseInvoice = async ({
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
    type,
    amount: amountBody,
    currency: currencyBody,
    note,
    action,
  } = InvoiceSchema.houseInvoiceSchema.parse(req.body);
  let details: any;
  let broker;
  let commission;
  let customerId;
  let amount = amountBody;
  let tenantId;
  let currency = currencyBody;
  if (type === "rent") {
    const { details: rentDetails, tenant } =
      InvoiceSchema.houseInvoiceRentDetails.parse(req.body);
    details = rentDetails;
    const isTenant = await getTenantModel(req.db!)
      .findOne({
        _id: tenant,
        isDeleted: false,
      })
      .session(session);
    if (!isTenant) {
      throw new Error("Tenant not found");
    }
    if (isTenant.endDate) {
      throw new Error("Tenant is Moved");
    }
    customerId = isTenant.customer;
    tenantId = isTenant._id;
    amount = isTenant.amount;
    details.floor = isTenant.floor;
    details.houseNo = isTenant.no;
    details.description = `Rent for ${rentDetails.month}/${rentDetails.year} (Floor ${isTenant.floor}, House ${isTenant.no})`;
    // check is any transaction exists
    const isTransaction = await getTransactionModel(req.db!)
      .findOne({
        tenant: tenant,
        houseInvoice: "rent",
        "details.month": rentDetails.month,
        "details.year": rentDetails.year,
        isDeleted: false,
        action,
      })
      .session(session);
    if (isTransaction) {
      throw new Error(
        action === "debit"
          ? `Tenant already Paid ${rentDetails.month}/${rentDetails.year}`
          : `Tenant already Invoiced ${rentDetails.month}/${rentDetails.year}`,
      );
    }
    currency = "KSH";
  } else {
    const {
      details: saleDetails,
      broker: saleBroker,
      commission: saleCommission,
      customer: saleCustomer,
    } = InvoiceSchema.houseInvoiceSaleDetails.parse(req.body);
    details = saleDetails;
    broker = saleBroker;
    commission = saleCommission;
    customerId = saleCustomer;
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

  const transactionData: any = {
    date,
    store: isCustomer.store,
    type: "house-invoice",
    houseInvoice: type,
    ref,
    tenant: tenantId,
    note,
    details: details,
    customer: {
      name: isCustomer.name,
      _id: isCustomer._id,
    },
    currency,
    amount,
    by: req.by!,
    action: action,
    profile: "customer",
  };
  if (action === "debit") {
    const { drawer } = TransactionSchema.drawer.parse(req.body);
    const isDrawer = await getDrawerModel(req.db!).findOne({
      _id: drawer,
      isDeleted: false,
    });
    if (!isDrawer) {
      throw new Error("Drawer not found");
    }
    transactionData.to = {
      name: isDrawer.name,
      _id: isDrawer._id,
    };
  }
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
