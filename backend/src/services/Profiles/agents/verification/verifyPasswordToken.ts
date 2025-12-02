import { ClientSession } from 'mongoose';
import z from 'zod';
import { ExpressRequest } from '../../../../types/Express.js';
import getAgentModel from '../../../../models/profiles/Agent.js';
import { dbName } from '../../../../server.js';
import getVerificationModel from '../../../../models/verification.js';
import { passwordEncryption } from '../../../../func/Encryptions.js';

const schema = z.object({
  token: z.string('Token is required'),
  email: z.email('Email is required'),
});

const verifyPasswordToken = async ({
  req,
  session,
}: {
  req: ExpressRequest;
  session: ClientSession;
}) => {
  const Model = getAgentModel();
  const { token, email } = schema.parse(req.body);

  const isExist = await Model.findOne({ email, isDeleted: false }).session(
    session
  );
  if (!isExist) {
    throw new Error(`Agent not found`);
  }
  // check if token is exist
  const isTokenExist = await getVerificationModel(dbName).findOne({
    type: 'password-reset',
    'profile._id': isExist._id,
    model: 'agent',
    isUsed: false,
  });
  if (!isTokenExist) {
    throw new Error('There is no password reset for this profile');
  }
  // check if token is expired
  if (isTokenExist.expires < Date.now()) {
    throw new Error('Token expired, please request a new token');
  }
  // verify the token
  const isTokenValid = await passwordEncryption.verifyPasskeyToken({
    token: token,
    hash: isTokenExist.token,
  });
  if (!isTokenValid) {
    throw new Error('Invalid password reset token');
  }
  return {
    id: isExist._id,
    oldPassword: isExist.password,
    tokenId: isTokenExist._id,
  };
};

export default verifyPasswordToken;
