import Interview from "../../models/Interview.js";
import { generateInterviewCode } from "../utils/interviewCode.js";

export const createInterview = async (req, res) => {
  try {
    // The authenticated user becomes the interviewer
    const interviewerId = req.user._id;

    // Generate a unique 6-character interview code
    const roomCode = await generateInterviewCode();

    // Create the interview
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