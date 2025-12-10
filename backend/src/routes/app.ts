import { Router } from 'express';
import appController from '../controllers/App/controller.js';

const router = Router();

router.get('/get/:type', appController);

export default router;
