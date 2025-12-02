import { ClientSession } from 'mongoose';
import zodFields from '../../zod/Fields.js';
import z from 'zod';

import Enums from '../../func/Enums.js';
import getVerificationModel from '../../models/verification.js';
import moment from 'moment-timezone';

const schema = z
  .object({
    type: z.enum(Enums.VerificationTypes as [string, ...string[]]),
    model: z.enum(Enums.models as [string, ...string[]]),
    profile: z.object({
      _id: zodFields.objectId('Profile ID is required'),
      name: z.string('Profile name is required'),
    }),
    email: z.string().email().optional(),
    phone: zodFields.phone.optional(),
    token: z.string('Token is required'),
    expires: z.number('Expiration date is required'),
    dbName: z.string('Database name is required'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'email-verification') {
      if (!data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email is required',
        });
      }
    } else if (data.type === 'phone-verification') {
      if (!data.phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone is required',
        });
      }
    }
  });
type Props = z.infer<typeof schema> & {
  session: ClientSession;
};
const createVerification = async (datas: Props) => {
  const { type, model, profile, email, phone, token, expires, dbName } =
    schema.parse(datas);
  const { session } = datas;
  const createData: any = {
    type,
    model,
    profile,
    email,
    phone,
    token,
    expires,
  };
  // check if verification already exists and
  const findQuery: any = {
    type: type,
    isUsed: false,
    'profile._id': profile._id,
  };
  if (type === 'email-verification') {
    findQuery.email = email;
  }

  const Verification = getVerificationModel(dbName);
  const hasVerification = await Verification.findOne(findQuery);

  if (hasVerification) {
    // check if there email verification less than 3minutes thne send error
    if (moment(hasVerification.createdAt).add(3, 'minutes').isAfter(moment())) {
      throw new Error(
        'There is a verification  sent to you recently, please wait for 3 minutes or contact support'
      );
    }
  }
  // delete the email verification
  await Verification.deleteMany({
    type: type,
    'profile._id': profile._id,
  }).session(session);
  const create = await Verification.create([createData], { session });
  if (!create.length) {
    throw new Error('Failed to create verification');
  }
  return create[0];
};

export default createVerification;
