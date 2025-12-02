import z from 'zod';
import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';
import getAgentModel from '../../../../models/profiles/Agent.js';
import addLogs from '../../../Logs.js';
import { codeEncryption } from '../../../../func/Encryptions.js';
import createVerification from '../../../verifications/create.js';
import { dbName } from '../../../../server.js';
import Emails from '../../../Messages/emails/index.js';

const details = z.object({
  name: z.string().min(2).max(20),
  surname: z.string().min(2).max(20),
  email: z.string().email('Invalid email address'),
  role: zodFields.role,
  sex: zodFields.sex,
  phone: zodFields.phone.optional(),
});

const createAgent = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const parsed = details.parse(req.body);
  const { name, surname, email, role, sex, phone } = parsed;

  const createData: any = {
    name,
    surname,
    email,
    role,
    sex,
    phone,
  };

  const Model = getAgentModel();
  // check if email already exists
  const emailExists = await Model.findOne({ email });
  if (emailExists) {
    if (emailExists.isEmailVerified) {
      throw new Error(
        `Email already exists and verified on ${emailExists.name}  ${emailExists.surname}`
      );
    } else {
      // delete that email
      await Model.deleteOne({ _id: emailExists._id }).session(session);
    }
  }
  const create = await Model.create([{ ...createData, by: req.by! }], {
    session,
  });
  if (!create.length) {
    throw new Error('Failed to create profile');
  }
  const user = create[0];
  //add logs
  await addLogs({
    model: { type: 'agent', _id: user._id },
    data: createData,
    old: {},
    dbName: dbName,
    by: { _id: req.id!, name: req.names! },
    action: 'create',
    session,
  });
  // now send the email
  const token = await codeEncryption.generateOtp();

  await createVerification({
    model: 'agent',
    profile: { _id: user._id.toString(), name: user.name },
    type: 'email-verification',
    email: user.email,
    token: token.hash,
    expires: token.expire,
    session,
    dbName,
  });
  const sendEmail = await Emails.Verification({
    name: `${user.name} ${user.surname}`,
    email: user.email,
    token: token.code,
    subject: 'Agent Email Verification',
    company: 'Warqad.com',
    title: 'Agent Email Verification Token',
    message: 'Please use the following token to verify your email address.',
  });
  if (!sendEmail.ok) {
    throw new Error(
      sendEmail.message || 'Sending Email Verification Token Failed'
    );
  }
  return create[0];
};
export default createAgent;
