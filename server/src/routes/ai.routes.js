import express from "express";
import { debugCode } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/debug", debugCode);

export default router;