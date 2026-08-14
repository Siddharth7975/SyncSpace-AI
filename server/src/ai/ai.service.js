// Connecting Node.js -> Ollama and Qwen3 8B
const OLLAMA_URL = "http://localhost:11434/api/chat";

export const askAI = async (prompt) => {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3:8b",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        think: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();

    return data.message.content;
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};