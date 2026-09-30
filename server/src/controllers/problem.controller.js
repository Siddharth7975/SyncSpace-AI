import Problem from "../../models/Problem.js";

export const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find({
      isActive: true,
    })
      .select(
        "title description difficulty topics examples constraints starterCode"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error("Get problems error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch problems",
    });
  }
};