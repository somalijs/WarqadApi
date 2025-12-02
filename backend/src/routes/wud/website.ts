import { Router } from 'express';

const router = Router();

import Protect from '../../middleware/auth/Protect.js';
import {
  createPackage,
  deletePackage,
  updatePackage,
  updatePackageImage,
  websiteContoller,
} from '../../controllers/WUD/website/index.js';
import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
});
router.post(
  '/add/:type',
  Protect.User,
  upload.array('files', 5),
  createPackage
);
router.put('/edit/:type', Protect.User, updatePackage);
router.get('/get/:type', Protect.User, websiteContoller);
router.put('/delete/:type/:id', Protect.User, deletePackage);
router.post(
  '/image/:id',
  Protect.User,
  upload.array('files', 1),
  updatePackageImage
);

export default router;
