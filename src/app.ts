import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.route";
import videoRoutes from "./routes/video.route";
import creatorRoutes from "./routes/creator.route";

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/creators", creatorRoutes);

app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
