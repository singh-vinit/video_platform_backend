import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.route";
import videoRoutes from "./routes/video.route";
import creatorRoutes from "./routes/creator.route";
import subscriptionRoutes from "./routes/subscription.route";
import commentRoutes from "./routes/comment.route";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/creators", creatorRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/comments", commentRoutes);

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

export default app;