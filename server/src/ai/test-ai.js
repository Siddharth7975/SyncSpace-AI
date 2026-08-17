import { askAI } from "./ai.service.js";

const test = async () => {
  const response = await askAI("Explain what JavaScript is in one sentence.");

  console.log("\n========== AI RESPONSE ==========");
  console.log(response);
  console.log("=================================\n");
};

test();