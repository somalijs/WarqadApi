import express from 'express';
import Protect, { Authorize } from '../../middleware/auth/Protect.js';
import {
  createUser,
  updateDetails,
  getUsers,
  activateUser,
  updateEmail,
  updatePhone,
  resendEmailVerification,
  verifyEmail,
  resetPassword,
} from '../../controllers/WAD/users/index.js';
const router = express.Router();

// create user
router.post('/create', Protect.Agent, Authorize('admin'), createUser);
// update details
router.put(
  '/update-details/:id',
  Protect.Agent,
  Authorize('admin'),
  updateDetails
);
// get users
router.get('/get', Protect.Agent, Authorize('admin'), getUsers);
// activate user
router.put('/activate/:id', Protect.Agent, Authorize('admin'), activateUser);
// update email
router.put('/update-email/:id', Protect.Agent, Authorize('admin'), updateEmail);
// update phone
router.put('/update-phone/:id', Protect.Agent, Authorize('admin'), updatePhone);
// resend email verification
router.put(
  '/resend-email-verification/:id',
  Protect.Agent,
  Authorize('admin'),
  resendEmailVerification
);
// verify email
router.put('/verify-email/:id', Protect.Agent, Authorize('admin'), verifyEmail);
// reset password
router.put(
  '/reset-password/:id',
  Protect.Agent,
  Authorize('admin'),
  resetPassword
);
export default router;
