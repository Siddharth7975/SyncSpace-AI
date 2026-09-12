import express from "express";
import { protect } from "../auth/auth.middleware.js";
import { createInterview } from "../controllers/interview.controller.js";

const router = express.Router();

// Create a new DSA interview
router.post("/", protect, createInterview);

export default router;