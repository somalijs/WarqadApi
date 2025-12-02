import { Router } from 'express';
import {
  createApp,
  updateApp,
  activateApp,
  getApps,
  generateNewSecretKey,
  getSecretkey,
  manageDomains,
} from '../../controllers/WAD/app/index.js';
import Protect from '../../middleware/auth/Protect.js';
const router = Router();

router.post('/create', Protect.Agent, createApp);
router.put('/update/:id', Protect.Agent, updateApp);
router.put('/activate/:id', Protect.Agent, activateApp);
router.put('/new-secret-key/:id', Protect.Agent, generateNewSecretKey);
router.get('/get', Protect.Agent, getApps);
router.get('/get-secret-key/:id', Protect.Agent, getSecretkey);
router.put('/domains/:id', Protect.Agent, manageDomains);
export default router;
