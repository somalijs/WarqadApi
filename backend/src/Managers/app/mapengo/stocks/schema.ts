import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const base = z.object({
  date: zodFields.date,
  store: zodFields.objectId("store id"),
  stockType: z.enum(Enums.stockTypes),
  action: z.enum(Enums.action),
});
const transferBase = z.object({
  date: zodFields.date,
  from: zodFields.objectId("store id"),
  to: zodFields.objectId("store id"),
  stockTransferType: z.enum(Enums.stockTransferTypes),
});
const saleBase = z.object({
  date: zodFields.date,
  store: zodFields.objectId("store id"),
  exchangeRate: z
    .number()
    .min(0, "Exchange rate must be greater than 0")
    .optional(),
  saleType: z.enum(Enums.invoiceTypes),
});
const bags = z.object({
  bagType: z.enum(Enums.bags),
});
const store = z.object({
  store: zodFields.objectId("store id"),
});
const pressureNo = z.object({
  no: z.string().min(1, "Pressure number is required"),
});
const stocksBags = z.object({
  stocks: z
    .array(
      z.object({
        item: zodFields.objectId("bag id"),
        quantity: z.number().gt(0, "Quantity must be greater than 0"),
      }),
    )
    .min(1, "At least one stock is required"),
});
const stocksItem = z.object({
  stocks: z
    .array(
      z.object({
        product: zodFields.objectId("product id"),
        quantity: z.number().gt(0, "Quantity must be greater than 0"),
        cost: z.number().gt(0, "Cost must be greater than 0"),
      }),
    )
    .min(1, "At least one stock is required"),
});
const saleStocks = z.object({
  stocks: z
    .array(
      z.object({
        item: zodFields.objectId("item id"),
        quantity: z.number().gt(0, "Quantity must be greater than 0"),
        cost: z.number().gt(0, "Cost must be greater than 0"),
        sell: z.number().gt(0, "Sell must be greater than 0"),
      }),
    )
    .min(1, "At least one stock is required"),
});
const cashSale = z.object({
  currency: z.enum(["USD", "TZS"]),
});
const invoiceSale = z.object({
  customer: zodFields.objectId("customer id"),
});
const StockSchema = {
  base,
  store,
  bags,
  cashSale,
  invoiceSale,
  stocksBags,
  stocksItem,
  pressureNo,
  saleBase,
  saleStocks,
  transferBase,
};

export default StockSchema;
