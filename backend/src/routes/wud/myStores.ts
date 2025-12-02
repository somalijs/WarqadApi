import express from 'express';
import { getMyStores } from '../../controllers/WUD/myStores/index.js';
import Protect from '../../middleware/auth/Protect.js';
const router = express.Router();

router.get('/get', Protect.User, getMyStores);

export default router;
