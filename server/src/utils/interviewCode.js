import Interview from "../../models/Interview.js";

const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateInterviewCode = async () => {
  while (true) {
    let code = "";

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(
        Math.random() * CHARACTERS.length
      );

      code += CHARACTERS[randomIndex];
    }

    const existingInterview = await Interview.findOne({
      roomCode: code,
    });

    if (!existingInterview) {
      return code;
    }
  }
};