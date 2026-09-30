import express from "express";
import { protect } from "../auth/auth.middleware.js";

import {
  createInterview,
  getInterviewByCode,
  startInterview,
  selectProblem
} from "../controllers/interview.controller.js";

const router = express.Router();

router.post("/", protect, createInterview);

router.get("/:roomCode", protect, getInterviewByCode);

router.patch("/:id/start", protect, startInterview);

router.patch("/:id/problem", protect, selectProblem);

export default router;