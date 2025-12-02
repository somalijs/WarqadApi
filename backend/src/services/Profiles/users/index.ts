import updateDetails from './manage/updateDetails.js';

import updateEmail from './manage/updateEmail.js';
import updatePhone from './manage/updatePhone.js';

import { EmailLogin } from './auth/EmailLogin.js';

import resendEmailVerification from './verification/ResendEmailVerification.js';
import verifyEmail from './verification/verifyEmail.js';
import resetPassword from './manage/resetPassword.js';

import createUser from './manage/Create.js';
import getUsers from './controller/get.js';
import activateUser from './manage/activate.js';
import verifyPasswordToken from './verification/verifyPasswordToken.js';
import updatePassword from './manage/updatePassword.js';
import storeAccess from './manage/StoreAccess.js';
const User = {
  create: createUser,
  updateDetails,
  updateEmail,
  updatePhone,
  storeAccess,
  activate: activateUser,
  EmailLogin: EmailLogin,
  get: getUsers,
  resendEmailVerification,
  verifyEmail,
  resetPassword,
  verifyPasswordToken,
  updatePassword,
};

export default User;
