import express from "express";
import { getProblems } from "../controllers/problem.controller.js";

const router = express.Router();

router.get("/", getProblems);

export default router;