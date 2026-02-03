import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().trim().toLowerCase().min(2),
  unit: z.enum(["ctn", "pack", "pcs"]),
  unitQty: z.coerce.number().default(1),
  cost: z.coerce.number().default(0),
  store: z.string(),
});

export default ProductSchema;
