import express from 'express';
// import Protect, { Authorize } from '../../middleware/auth/Protect.js';
import {
  EmailLogin,
  verifyPasswordToken,
  updatePassword,
  getMe,
  logout,
  getUsers,
  createUser,
  updateDetails,
  updatePhone,
  updateEmail,
  resendEmailVerification,
  verifyEmail,
  resetPassword,
  storeAccess,
  resetPasswordViaEmail,
} from '../../controllers/WUD/myUsers/index.js';
import Protect, { Authorize } from '../../middleware/auth/Protect.js';
import { activateUser } from '../../controllers/WAD/users/manage.js';
const router = express.Router();

router.post('/email-login', EmailLogin);
router.put('/verify-password-token/:app', verifyPasswordToken);

// update password
router.put('/update-password/:app', updatePassword);
router.post('/create', Protect.User, Authorize('admin'), createUser);

// get me
router.get('/me', Protect.User, getMe);
// logout
router.get('/logout', Protect.User, logout);
// get users
router.get('/get', Protect.User, Authorize('admin'), getUsers);
// update details
router.put(
  '/update-details/:id',
  Protect.User,
  Authorize('admin'),
  updateDetails
);
router.put('/activate/:id', Protect.User, Authorize('admin'), activateUser);
// update phone
router.put('/update-phone/:id', Protect.User, Authorize('admin'), updatePhone);
// update email
router.put('/update-email/:id', Protect.User, Authorize('admin'), updateEmail);
// resend email verification
router.put(
  '/resend-email-verification/:id',
  Protect.User,
  Authorize('admin'),
  resendEmailVerification
);
// verify email
router.put('/verify-email/:id', Protect.User, Authorize('admin'), verifyEmail);
// reset password
router.put(
  '/reset-password/:id',
  Protect.User,
  Authorize('admin'),
  resetPassword
);
router.put('/reset-password-via-email/:app', resetPasswordViaEmail);
// store access
router.put('/store-access', Protect.User, Authorize('admin'), storeAccess);
export default router;
