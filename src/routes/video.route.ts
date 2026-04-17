import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import {
  uploadVideo,
  getMyVideos,
  getVideoById,
  deleteVideo,
  updateVideo,
} from "../controllers/video.controller";

const router = Router();

router.post("/", authenticate, requireRole("CREATOR"), uploadVideo);
router.get("/my", authenticate, requireRole("CREATOR"), getMyVideos);
router.delete("/:id", authenticate, requireRole("CREATOR"), deleteVideo);
router.patch("/:id", authenticate, requireRole("CREATOR"), updateVideo);
router.get("/:id", authenticate, getVideoById);

export default router;