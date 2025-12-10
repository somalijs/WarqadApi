import express from 'express';

const router = express.Router();

import { EAPI_AUTH, getWebsite } from '../../controllers/EAPI/index.js';

router.get('/get/website', getWebsite);
router.get('/auth', EAPI_AUTH);

export default router;
