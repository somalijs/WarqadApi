import expressAsyncHandler from 'express-async-handler';
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
} from '../../types/Express.js';

import getToken from '../../services/tokens/get.js';
import getAgentModel from '../../models/profiles/Agent.js';
const Agent = expressAsyncHandler(
  async (
    req: ExpressRequest,
    _res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    const token = await getToken({
      req,
      name: 'authToken',
      throwError: true,
    });
    const profile = await getProfile(token.decoded);
    req.names = `${profile.name} ${profile.surname}`;
    req.name = profile.name;
    req.surname = profile.surname;
    req.phoneNumber = profile?.phone?.number
      ? `${profile?.phone?.dialCode}${profile?.phone?.number}`
      : '';
    req.id = profile._id;
    req.email = profile.email;
    req.password = profile.password!;
    req.role = profile.role;
    req.status = profile.isActive ? 'active' : 'inactive';
    req.sex = profile.sex;
    req.isEmailVerified = profile.isEmailVerified;
    req.isPhoneVerified = profile.isPhoneVerified;
    req.by = { _id: profile._id, name: `${profile.name} ${profile.surname}` };
    next();
  }
);
const getProfile = async (id: string) => {
  const profile = await getAgentModel().findById(id);
  if (!profile) {
    throw new Error('Profile not found');
  }
  if (!profile.isActive) {
    throw new Error('Your account is not active! Please contact support');
  }
  if (!profile.isEmailVerified) {
    throw new Error('Your email is not verified! Please verify your email');
  }
  //   if (!profile.isPhoneVerified) {
  //     throw new Error('Your phone is not verified! Please verify your phone');
  //   }
  return profile;
};
export default Agent;
