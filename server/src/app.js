import authRoutes from "./routes/auth.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/problems", problemRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "syncspace backend is running",
  });
});

export default app;
