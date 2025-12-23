import { Router } from 'express';
import {
  appFreeController,
  appPrivateController,
} from '../controllers/App/controller.js';
import Protect from '../middleware/auth/Protect.js';
import appCreateController from '../controllers/App/create.js';
import appUpdateController from '../controllers/App/update.js';
import appDeleteController from '../controllers/App/delete.js';

const router = Router();

router.get('/get/:type', appFreeController);
router.get('/get-private/:type', Protect.User, appPrivateController);
router.post('/get-private/:type', Protect.User, appPrivateController);
router.post('/create/:type', Protect.User, appCreateController);
router.put('/update/:type/:id', Protect.User, appUpdateController);
router.put('/delete/:type/:id', Protect.User, appDeleteController);
export default router;
