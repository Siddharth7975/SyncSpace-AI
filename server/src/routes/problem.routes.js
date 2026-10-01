import express from "express";

import {
  getProblems,
  runDSACode,
} from "../controllers/problem.controller.js";

const router = express.Router();

router.get("/", getProblems);

router.post("/run", runDSACode);

export default router;