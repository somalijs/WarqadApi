import { z } from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const stockSchema = z.object({
  index: z.number(),
  product: zodFields.objectId("product"),
  quantity: z.number(),
  price: z.number(),
});
const base = z.object({
  date: zodFields.date,
  profile: z.enum(Enums.saleProfiles),
  store: zodFields.objectId("store"),
  note: z.string().optional(),
});
const stockSale = base.extend({
  stocks: z.array(stockSchema).min(1, "At least one stock is required"),
});

const saleSchema = {
  base,
  stockSale,
};
export default saleSchema;
