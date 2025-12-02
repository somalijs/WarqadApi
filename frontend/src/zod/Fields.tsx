import z from 'zod';
import Enums from '@/func/Enums';

function objectId(message: string) {
  return z.string().refine((id) => /^[0-9a-fA-F]{24}$/.test(id), {
    message: `${message} is not a valid ObjectId`,
  });
}
const zodFields = {
  objectId,
  phone: z.object({
    number: z
      .string()
      .min(5, 'Phone number must be at least 5 characters')
      .regex(/^\d+$/, 'Phone number can only contain digits'),
    dialCode: z
      .string()
      .min(1, 'Dial code is required')
      .regex(/^\+\d+$/, "Dial code must start with '+' followed by numbers"),
  }),
  role: z.enum(Enums.roles as [string, ...string[]]),
  sex: z.enum(Enums.gender as [string, ...string[]]),
};

export default zodFields;
