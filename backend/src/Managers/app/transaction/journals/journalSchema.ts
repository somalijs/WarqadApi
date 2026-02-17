import z from "zod";
import zodFields from "../../../../zod/Fields.js";
import Enums from "../../../../func/Enums.js";

const base = z.object({
  date: zodFields.date,
  note: z.string().optional(),
  store: zodFields.objectId("Store"),
  profile: z.enum(["customer", "supplier", "employee", "shop", "finance"]),
  journalType: z.enum(Enums.journalTypes),
  amount: z.number().min(0),
  description: z.string(),
});

const directJournal = z.object({
  currency: z.enum(Enums.currencies),
  action: z.enum(Enums.action),
});
const sarifJournal = z.object({
  sarif: zodFields.objectId("Sarif id"),
  fee: z.number().optional(),
});
const exchangeRate = z.object({
  exchangeRate: z.number().min(0),
});
export const JournalSchema = {
  base: base,
  directJournal,
  sarifJournal,
  exchangeRate,
};

export default JournalSchema;
