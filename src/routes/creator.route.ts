import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getAllCreators, getCreatorById } from "../controllers/creator.controller";

const router = Router();

router.get("/", authenticate, getAllCreators);
router.get("/:id", authenticate, getCreatorById);

export default router;