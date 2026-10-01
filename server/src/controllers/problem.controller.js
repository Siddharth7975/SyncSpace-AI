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

/*
=========================================================
RUN DSA CODE
=========================================================
*/

export const runDSACode = async (req, res) => {
  try {
    const {
      problemId,
      language,
      code,
    } = req.body;

    // ---------------------------------------------
    // Validate request
    // ---------------------------------------------

    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: "Problem ID is required.",
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Programming language is required.",
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code cannot be empty.",
      });
    }

    const allowedLanguages = [
      "javascript",
      "python",
      "cpp",
    ];

    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported programming language.",
      });
    }

    // ---------------------------------------------
    // Find problem
    // ---------------------------------------------

    const problem = await Problem.findOne({
      _id: problemId,
      isActive: true,
    }).select(
      "title testCases"
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }

    // ---------------------------------------------
    // Temporary response
    //
    // Execution engine will be added next.
    // ---------------------------------------------

    return res.status(200).json({
      success: true,
      message: "DSA code received successfully.",
      problem: {
        id: problem._id,
        title: problem.title,
      },
      language,
      testCaseCount: problem.testCases.length,
    });

  } catch (error) {
    console.error("Run DSA code error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process DSA code.",
    });
  }
};