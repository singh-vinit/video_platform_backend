import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { postComment, getComments } from "../controllers/comment.controller";

const router = Router();

router.post("/:videoId", authenticate, postComment);
router.get("/:videoId", authenticate, getComments);

export default router;