import {
  createAgent,
  updateDetails,
  updateEmail,
  updatePhone,
  activate,
  resetPassword,
  updatePassword,
} from './manage.js';
import { EmailLogin, logout, getMe } from './auth.js';
import { getAgents } from './controller.js';
import {
  resendEmailVerification,
  verifyEmail,
  verifyPasswordToken,
} from './verifications.js';
export {
  createAgent,
  updateDetails,
  updateEmail,
  updatePhone,
  activate,
  EmailLogin,
  logout,
  getMe,
  getAgents,
  resendEmailVerification,
  verifyEmail,
  resetPassword,
  verifyPasswordToken,
  updatePassword,
};
