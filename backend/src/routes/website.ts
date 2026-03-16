import { Router } from "express";

import multer from "multer";
import Protect from "../middleware/auth/Protect.js";
import websiteManager from "../controllers/Website/manager.js";
import websitePublic from "../controllers/Website/public.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per file
});
const router = Router();

router.post(
  "/manager/:type",
  Protect.User,
  upload.array("files", 5),
  websiteManager,
);
router.put(
  "/manager/:type",
  Protect.User,
  upload.array("files", 5),
  websiteManager,
);
router.get("/manager/:type", Protect.User, websiteManager);
router.get("/public/:type", websitePublic);
router.post("/public/:type", websitePublic);
export default router;
