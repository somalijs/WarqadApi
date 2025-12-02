import { Router } from 'express';
import {
  createStore,
  updateStoreDetails,
  activateStore,
  getStores,
} from '../../controllers/WAD/store/index.js';
import Protect from '../../middleware/auth/Protect.js';
const router = Router();

router.post('/create', Protect.Agent, createStore);
router.put('/update-details/:id', Protect.Agent, updateStoreDetails);
router.put('/activate/:id', Protect.Agent, activateStore);
router.get('/get', Protect.Agent, getStores);

export default router;
