import Problem from "../../models/Problem.js";
import { generateCppProgram } from "../utils/cppDriver.js";
import { runCppCode } from "../utils/cppRunner.js";


// ============================================================
// GET ALL PROBLEMS
// ============================================================

export const getProblems = async (req, res) => {
  try {
    const problems = await Problem.find({
      isActive: true,
    })
      .select(
        "title description difficulty topics examples constraints starterCode execution testCases"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: problems.length,
      problems,
    });
  } catch (error) {
    console.error(
      "Get problems error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch problems",
    });
  }
};


// ============================================================
// RUN DSA CODE
// ============================================================

export const runDSACode = async (req, res) => {
  try {
    const {
      problemId,
      language,
      code,
    } = req.body;


    // --------------------------------------------------------
    // Validate request
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // Only C++ for now
    // --------------------------------------------------------

    if (language !== "cpp") {
      return res.status(400).json({
        success: false,
        message: "Only C++ execution is supported.",
      });
    }


    // --------------------------------------------------------
    // Find problem
    // --------------------------------------------------------

    const problem = await Problem.findOne({
      _id: problemId,
      isActive: true,
    }).select(
      "title execution testCases"
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: "Problem not found.",
      });
    }


    // --------------------------------------------------------
    // Check execution metadata
    // --------------------------------------------------------

    if (!problem.execution) {
      return res.status(500).json({
        success: false,
        message:
          "Execution configuration is missing for this problem.",
      });
    }


    // --------------------------------------------------------
    // Check test cases
    // --------------------------------------------------------

    if (
      !problem.testCases ||
      problem.testCases.length === 0
    ) {
      return res.status(500).json({
        success: false,
        message:
          "No test cases configured for this problem.",
      });
    }


    // --------------------------------------------------------
    // Generate complete C++ program
    // --------------------------------------------------------

    const completeCode =
      generateCppProgram(
        problem,
        code
      );


    // --------------------------------------------------------
    // Compile + execute
    // --------------------------------------------------------

    const executionResult =
      await runCppCode(
        completeCode
      );


    // --------------------------------------------------------
    // Compilation / runtime error
    // --------------------------------------------------------

    if (!executionResult.success) {
      return res.status(200).json({
        success: true,

        result: "failed",

        problem: {
          id: problem._id,
          title: problem.title,
        },

        error: {
          stage: executionResult.stage,
          message: executionResult.error,
        },

        testCases: {
          total: problem.testCases.length,
          passed: 0,
        },

        results: [],
      });
    }


    // --------------------------------------------------------
    // Get actual outputs
    // --------------------------------------------------------

    const actualOutputs =
      executionResult.output
        .split("__TEST_END__")
        .filter(
          (output) =>
            output.trim() !== ""
        );


    // --------------------------------------------------------
    // Compare every test case
    // --------------------------------------------------------

    const results =
      problem.testCases.map(
        (testCase, index) => {

          const actualOutput =
            actualOutputs[index]
              ? actualOutputs[index].trim()
              : "";

          const expectedOutput =
            testCase.expectedOutput.trim();


          // Remove unnecessary whitespace
          // so [0, 1] and [0,1] are treated
          // as the same output.

          const normalizeOutput =
            (value) =>
              value
                .trim()
                .replace(/\s+/g, "");


          const passed =
            normalizeOutput(
              actualOutput
            ) ===
            normalizeOutput(
              expectedOutput
            );


          return {
            testCase: index + 1,

            input:
              testCase.input,

            expectedOutput,

            actualOutput,

            passed,

            stage: "runtime",
          };
        }
      );


    // --------------------------------------------------------
    // Calculate result
    // --------------------------------------------------------

    const passedCount =
      results.filter(
        (result) =>
          result.passed
      ).length;

    const totalTests =
      problem.testCases.length;

    const allPassed =
      passedCount === totalTests;


    // --------------------------------------------------------
    // Send final response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      result: allPassed
        ? "passed"
        : "failed",

      problem: {
        id: problem._id,
        title: problem.title,
      },

      testCases: {
        total: totalTests,
        passed: passedCount,
      },

      results,
    });

  } catch (error) {

    console.error(
      "Run DSA code error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to execute C++ code.",
      error:
        error.message,
    });
  }
};