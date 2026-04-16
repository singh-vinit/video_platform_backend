import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import {
  subscribe,
  unsubscribe,
  getFeed,
  getMySubscriptions,
} from "../controllers/subscription.controller";

const router = Router();

router.post("/:creatorId", authenticate, requireRole("USER"), subscribe);
router.delete("/:creatorId", authenticate, requireRole("USER"), unsubscribe);
router.get("/feed/me", authenticate, requireRole("USER"), getFeed);
router.get("/mine", authenticate, requireRole("USER"), getMySubscriptions);

export default router;