import z from 'zod';

import zodFields from '../../../../zod/Fields.js';
import { ExpressRequest } from '../../../../types/Express.js';
import { ClientSession } from 'mongoose';
import getAgentModel from '../../../../models/profiles/Agent.js';
import { dbName } from '../../../../server.js';
import getVerificationModel from '../../../../models/verification.js';
import { codeEncryption } from '../../../../func/Encryptions.js';
import createVerification from '../../../verifications/create.js';
import Emails from '../../../Messages/emails/index.js';
const schema = z.object({
  id: zodFields.objectId('Profile ID is required'),
});

const resendEmailVerification = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const { id } = schema.parse(req.params);
  const Model = getAgentModel();
  // check if profile exists
  const isExist = await Model.findById(id).session(session);
  if (!isExist) {
    throw new Error(`Agent not found`);
  }

  // check if profile is email has verification
  const hasVerification = await getVerificationModel(dbName).findOne({
    'profile._id': isExist._id,
    type: 'email-verification',
    model: 'agent',
    isUsed: false,
    email: { $exists: true },
  });
  if (!hasVerification) {
    throw new Error(`There is no email verification for this agent`);
  }
  const token = await codeEncryption.generateOtp();
  const user = isExist;
  // create new verification
  await createVerification({
    model: 'agent',
    profile: { _id: isExist._id.toString(), name: isExist.name },
    type: 'email-verification',
    email: hasVerification.email as string,
    token: token.hash,
    expires: token.expire,
    session,
    dbName,
  });
  const sendEmail = await Emails.Verification({
    name: `${user.name} ${user.surname}`,
    email: user.email,
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
  return user;
};

export default resendEmailVerification;
