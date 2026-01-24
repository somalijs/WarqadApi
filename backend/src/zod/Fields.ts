import z from "zod";
import Enums from "../func/Enums.js";
import mongoose from "mongoose";
import moment from "moment";
function objectId(message: string) {
  return z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: `${message} is not a valid object id`,
  });
}
const zodFields = {
  objectId,

  name: z
    .string()
    .min(2, "Name is required")
    .transform((val) => val.trim().toLowerCase().replace(/\s+/g, " ")),
  phone: z.object({
    number: z
      .string()
      .min(5, "Phone number must be at least 5 characters")
      .regex(/^\d+$/, "Phone number can only contain digits"),
    dialCode: z
      .string()
      .min(1, "Dial code is required")
      .regex(/^\+\d+$/, "Dial code must start with '+' followed by numbers"),
  }),
  phoneNumber: z
    .string()
    .min(5, "Phone number must be at least 5 characters")
    .max(15, "Phone number must be less than 15 characters")
    .regex(/^\+?\d{5,15}$/, "Please enter a valid phone number"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  role: z.enum(Enums.roles as [string, ...string[]]),
  sex: z.enum(Enums.gender as [string, ...string[]]),
  date: z
    .string()
    .regex(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
      "Date must be in format DD/MM/YYYY",
    )
    .refine((val) => moment(val, "DD/MM/YYYY", true).isValid(), {
      message: "Date is not a valid calendar date",
    }),
};

export default zodFields;
