import Interview from "../../models/Interview.js";
import { generateInterviewCode } from "../utils/interviewCode.js";
import Problem from "../../models/Problem.js";

export const createInterview = async (req, res) => {
  try {
    const interviewerId = req.user._id;

    const roomCode = await generateInterviewCode();

    const interview = await Interview.create({
      roomCode,
      interviewerId,
      candidateId: null,
      problemId: null,
      status: "waiting",
    });

    return res.status(201).json({
      success: true,
      message: "Interview created successfully",
      interview: {
        id: interview._id,
        roomCode: interview.roomCode,
        interviewerId: interview.interviewerId,
        candidateId: interview.candidateId,
        problemId: interview.problemId,
        status: interview.status,
        createdAt: interview.createdAt,
      },
    });
  } catch (error) {
    console.error("Create interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create interview",
      error: error.message,
    });
  }
};

export const getInterviewByCode = async (req, res) => {
  try {
    const roomCode = req.params.roomCode.toUpperCase();

    const interview = await Interview.findOne({
      roomCode,
    }).populate("interviewerId", "name email");

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      interview: {
        id: interview._id,
        roomCode: interview.roomCode,
        interviewer: interview.interviewerId,
        candidateId: interview.candidateId,
        problemId: interview.problemId,
        status: interview.status,
        createdAt: interview.createdAt,
      },
    });
  } catch (error) {
    console.error("Get interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch interview",
      error: error.message,
    });
  }
};

export const startInterview = async (req, res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      interviewerId: req.user._id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (!interview.candidateId) {
      return res.status(400).json({
        success: false,
        message: "Candidate has not joined yet",
      });
    }

    if (interview.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Interview cannot be started",
      });
    }

    interview.status = "active";

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Interview started successfully",
      interview: {
        id: interview._id,
        roomCode: interview.roomCode,
        candidateId: interview.candidateId,
        problemId: interview.problemId,
        status: interview.status,
      },
    });
  } catch (error) {
    console.error("Start interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to start interview",
      error: error.message,
    });
  }
};

export const selectProblem = async (req, res) => {
  try {
    const { problemId } = req.body;
    const interviewId = req.params.id;

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: "Problem ID is required",
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    if (
      interview.interviewerId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the interviewer can select a problem",
      });
    }

    if (interview.status !== "waiting") {
      return res.status(400).json({
        success: false,
        message: "Problem cannot be changed after the interview starts",
      });
    }

    const problem = await Problem.findOne({
      _id: problemId,
      isActive: true,
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found",
      });
    }

    interview.problemId = problem._id;

    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Problem selected successfully",
      problem: {
        _id: problem._id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        topics: problem.topics,
        examples: problem.examples,
        constraints: problem.constraints,
        starterCode: problem.starterCode,
      },
    });
  } catch (error) {
    console.error("Select problem error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to select problem",
    });
  }
};