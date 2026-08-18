import { askAI } from "../ai/ai.service.js";

export const debugCode = async (req, res) => {
  try {
    const { code, error, language } = req.body;

    if (!code || !error || !language) {
      return res.status(400).json({
        success: false,
        message: "Code, error and language are required",
      });
    }

    const prompt = `
You are SyncSpace's AI Code Assistant.

You are an expert ${language} debugging assistant.

Analyze the code using the ACTUAL runtime error provided below.

IMPORTANT RULES:
- The runtime error is real and was produced by executing the user's code.
- Do not invent or change the runtime error.
- Identify the root cause from the code and the actual error.
- Provide a corrected version of the code.
- Preserve the original purpose and behavior of the code whenever possible.
- Return valid ${language} code.
- Do not modify unrelated parts of the code.

Return your response using EXACTLY this structure:

### What went wrong
Explain the actual problem.

### Why it happened
Explain the root cause step by step.

### How to fix it
Explain what needs to change.

### Corrected code
Provide the complete corrected ${language} code inside a markdown code block.

CODE:
${code}

ACTUAL RUNTIME ERROR:
${error}
`;

    const response = await askAI(prompt);

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("AI Debug Error:", error);

    return res.status(500).json({
      success: false,
      message: "AI debugging failed",
      error: error.message,
    });
  }
};