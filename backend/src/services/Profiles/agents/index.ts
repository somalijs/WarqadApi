import updateDetails from './manage/updateDetails.js';
import createAgent from './manage/Create.js';
import updateEmail from './manage/updateEmail.js';
import updatePhone from './manage/updatePhone.js';
import activateProfile from './manage/activate.js';
import { EmailLogin } from './auth/EmailLogin.js';
import getAgents from './controller/get.js';
import resendEmailVerification from './verification/ResendEmailVerification.js';
import verifyEmail from './verification/verifyEmail.js';
import resetPassword from './manage/resetPassword.js';
import verifyPasswordToken from './verification/verifyPasswordToken.js';
import updatePassword from './manage/updatePassword.js';
const Agent = {
  create: createAgent,
  updateDetails,
  updateEmail,
  updatePhone,
  activate: activateProfile,
  EmailLogin: EmailLogin,
  get: getAgents,
  resendEmailVerification,
  verifyEmail,
  resetPassword,
  verifyPasswordToken,
  updatePassword,
};

export default Agent;
