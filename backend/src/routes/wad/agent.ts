import express from 'express';
import Protect, { Authorize } from '../../middleware/auth/Protect.js';
import {
  createAgent,
  activate,
  updateDetails,
  updateEmail,
  updatePhone,
  EmailLogin,
  logout,
  getMe,
  getAgents,
  resendEmailVerification,
  verifyEmail,
  resetPassword,
  verifyPasswordToken,
  updatePassword,
} from '../../controllers/WAD/agents/index.js';

const router = express.Router();

// unprotected routes
router.post('/email-login', EmailLogin);

// create agent
router.post('/create', Protect.Agent, Authorize('admin'), createAgent);
// update details
router.put(
  '/update-details/:id',
  Protect.Agent,
  Authorize('admin'),
  updateDetails
);
// update email
router.put('/update-email/:id', Protect.Agent, Authorize('admin'), updateEmail);
// update phone
router.put('/update-phone/:id', Protect.Agent, Authorize('admin'), updatePhone);
// activate
router.put('/activate/:id', Protect.Agent, Authorize('admin'), activate);
// logout
router.get('/logout', Protect.Agent, logout);
// get me
router.get('/me', Protect.Agent, getMe);
// get agents
router.get('/get', Protect.Agent, Authorize('admin'), getAgents);

// this api will resend email token
router.put(
  '/resend-email-verification/:id',
  Protect.Agent,
  resendEmailVerification
);
// this api will verify email
router.put('/verify-email/:id', Protect.Agent, verifyEmail);
// this api will reset password
router.put('/reset-password/:id', Protect.Agent, resetPassword);
// this api will verify password token
router.put('/verify-password-token', verifyPasswordToken);
// this api will update password
router.put('/update-password', updatePassword);
export default router;
