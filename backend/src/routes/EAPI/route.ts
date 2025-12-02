import express from 'express';

const router = express.Router();

import { getWebsite } from '../../controllers/EAPI/index.js';

router.get('/get/website', getWebsite);

export default router;
