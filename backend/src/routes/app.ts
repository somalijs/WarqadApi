import { Router } from "express";
import {
  appFreeController,
  appPrivateController,
} from "../controllers/App/controller.js";
import Protect from "../middleware/auth/Protect.js";
import appCreateController from "../controllers/App/create.js";
import appUpdateController from "../controllers/App/update.js";
import appDeleteController from "../controllers/App/delete.js";
import appManager from "../controllers/App/manager.js";
import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
});
const router = Router();

router.get("/get/:type", appFreeController);
router.get("/get-private/:type", Protect.User, appPrivateController);
router.post("/get-private/:type", Protect.User, appPrivateController);
router.post("/create/:type", Protect.User, appCreateController);
router.put("/update/:type/:id", Protect.User, appUpdateController);
router.put("/delete/:type/:id", Protect.User, appDeleteController);
router.post(
  "/manager/:type",
  Protect.User,
  upload.array("files", 1),
  appManager,
);
router.put(
  "/manager/:type",
  Protect.User,

  appManager,
);
router.get("/manager/:type", Protect.User, appManager);
export default router;
