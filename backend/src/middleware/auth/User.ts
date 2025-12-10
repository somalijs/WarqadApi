import expressAsyncHandler from 'express-async-handler';
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
} from '../../types/Express.js';

import getToken from '../../services/tokens/get.js';
import getUserModel from '../../models/profiles/User.js';
import getAppModel from '../../models/app.js';
import mongoose from 'mongoose';
const User = expressAsyncHandler(
  async (
    req: ExpressRequest,
    _res: ExpressResponse,
    next: ExpressNextFunction
  ) => {
    console.log(`reached`);
    const token = await getToken({
      req,
      name: 'authToken',
      throwError: true,
    });
    const app = await getApp(token.decoded.split(',')[0]);
    const profile = await getProfile({
      id: token.decoded.split(',')[1],
      dbName: app.ref,
    });
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
    // applications
    req.db = app.ref;
    req.application = {
      _id: app._id,
      name: app.name,
      shortName: getShortName(app.name) as string,
      isActive: app.isActive,
      status: app.isActive ? 'active' : 'inactive',
    };
    // stores
    req.stores = profile?.stores || [];

    next();
  }
);
const getProfile = async ({ id, dbName }: { id: string; dbName: string }) => {
  const match = {
    _id: new mongoose.Types.ObjectId(id),
  };

  const find = await getUserModel(dbName).aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'stores',
        let: { userStores: { $ifNull: ['$stores', []] }, userRole: '$role' },
        pipeline: [
          {
            $match: {
              $expr: {
                $cond: [
                  { $eq: ['$$userRole', 'admin'] }, // if admin → match all stores
                  true,
                  { $in: ['$_id', '$$userStores'] }, // else only user's stores
                ],
              },
            },
          },
          {
            $addFields: {
              status: {
                $cond: [{ $eq: ['$isActive', true] }, 'active', 'inactive'],
              },
            },
          },
        ],
        as: 'stores',
      },
    },
  ]);

  const profile = find[0];
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
const getApp = async (ref: string) => {
  const app = await getAppModel().findOne({
    ref,
    isDeleted: false,
  });
  if (!app) {
    throw new Error('App not found');
  }
  if (!app.isActive) {
    throw new Error('Your app is not active! Please contact support');
  }
  return app;
};
function getShortName(name: string): string {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}
export default User;
