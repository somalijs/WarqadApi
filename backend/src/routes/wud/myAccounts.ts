import express from 'express';
const router = express.Router();

import Protect, { Authorize } from '../../middleware/auth/Protect.js';
import {
  addAccount,
  getAccounts,
  editAccount,
  deleteAccount,
} from '../../controllers/WUD/myAccounts/index.js';
router.post('/add/:profile', Protect.User, addAccount);
router.get('/get', Protect.User, getAccounts);
router.put('/edit/:profile/:id', Protect.User, editAccount);
router.put(
  '/delete/:profile/:id',
  Protect.User,
  Authorize('admin'),
  deleteAccount
);

export default router;
