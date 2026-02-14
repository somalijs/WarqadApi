import { z } from "zod";
import zodFields from "../../../zod/Fields.js";
import Enums from "../../../func/Enums.js";
const itemSchema = z.object({
  product: zodFields.objectId("product id"),
  quantity: z.coerce.number().default(1),
  cost: z.coerce.number().default(0),
});
const ProductSchema = z.object({
  name: z.string().trim().toLowerCase().min(2),
  unit: z.enum(["ctn", "pack", "pcs"]).optional(),
  unitQty: z.coerce.number().default(1),
  cost: z.coerce.number().default(0),
  store: z.string().optional(),
  type: z.enum(Enums.productTypes),
  category: z.string().optional(),
  brand: z.string().optional(),
});
export const itemsSchema = z.object({
  items: z.array(itemSchema).min(1, "add at least one item"),
});

export const inventorySchema = z.object({
  name: z.string().trim().toLowerCase().min(2),
  type: z.enum(["brand", "category"]),
  store: z.string().optional(),
});
export default ProductSchema;
