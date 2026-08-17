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

Analyze the following ${language} code using the ACTUAL runtime error provided below.

Do not guess whether an error occurred.

Explain:
1. What went wrong
2. Why it happened
3. How to fix it
4. Provide corrected code

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