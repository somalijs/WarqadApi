import { Router } from 'express';
import {
  appFreeController,
  appPrivateController,
} from '../controllers/App/controller.js';
import Protect from '../middleware/auth/Protect.js';

const router = Router();

router.get('/get/:type', appFreeController);
router.get('/get-private/:type', Protect.User, appPrivateController);

export default router;
