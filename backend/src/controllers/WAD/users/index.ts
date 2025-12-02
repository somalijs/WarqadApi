import {
  createUser,
  updateDetails,
  activateUser,
  updateEmail,
  updatePhone,
  resetPassword,
} from './manage.js';
import { getUsers } from './controller.js';
import z from 'zod';
import zodFields from '../../../zod/Fields.js';
import getAppModel from '../../../models/app.js';

import { ExpressRequest } from '../../../types/Express.js';
import { resendEmailVerification, verifyEmail } from './verifications.js';
const appSchema = z.object({
  app: zodFields.objectId('app id'),
});
async function isAppExist(req: ExpressRequest) {
  const { app } = appSchema.parse(req.body || req.query);
  const isApp = await getAppModel().findOne({ _id: app, isDeleted: false });
  if (!isApp) {
    throw new Error('App not found');
  }
  return isApp;
}
export {
  createUser,
  updateDetails,
  getUsers,
  isAppExist,
  activateUser,
  updateEmail,
  updatePhone,
  resendEmailVerification,
  verifyEmail,
  resetPassword,
};
