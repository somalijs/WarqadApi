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

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
const idSchema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});

const updateEmail = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const Model = getAgentModel();
  const { email } = schema.parse(req.body);
  const { id } = idSchema.parse(req.params);

  const isExist = await Model.findOne({ _id: id, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`Agent not found`);
  }

  if (isExist.email === email) {
    throw new Error('new email is the same as the old email');
  }
  // check if email is already in use
  const isEmailUsed = await Model.findOne({
    email,
  }).session(session);

  if (isEmailUsed) {
    if (isEmailUsed?.isEmailVerified) {
      throw new Error('Email already in use and verified');
    } else {
      throw new Error('Email already in use and not verified');
    }
  }
  const news = {
    email,
  };
  const olds = {
    email: isExist.email,
  };

  // now send the email
  const token = await codeEncryption.generateOtp();

  await createVerification({
    model: 'agent',
    profile: { _id: isExist._id.toString(), name: isExist.name },
    type: 'email-verification',
    email: email,
    token: token.hash,
    expires: token.expire,
    session,
    dbName,
  });
  const sendEmail = await Emails.Verification({
    name: `${isExist.name} ${isExist.surname}`,
    email: email,
    token: token.code,
    subject: 'Email Verification',
    company: 'Warqad.com',
    title: 'Email Verification Token',
    message: 'Please use the following token to verify your email address.',
  });
  if (!sendEmail.ok) {
    throw new Error(
      sendEmail.message || 'Sending Email Verification Token Failed'
    );
  }

  if (!isExist.isEmailVerified) {
    const updateEmail = await Model.findByIdAndUpdate(
      isExist._id,
      {
        email: email,
      },
      { new: true, session, runValidators: true }
    );
    if (!updateEmail) {
      throw new Error('Unable to update email');
    }
  }
  await addLogs({
    model: { type: 'agent', _id: isExist._id },
    data: {
      email: news?.email,
      action: 'created email verification',
    },
    old: olds,
    by: req.by!,
    dbName: dbName,
    action: 'update',
    session,
  });
  return isExist;
};

export default updateEmail;
