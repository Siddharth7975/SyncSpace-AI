import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },

    topics: [
      {
        type: String,
        trim: true,
      },
    ],

    examples: [
      {
        input: {
          type: String,
          required: true,
        },

        output: {
          type: String,
          required: true,
        },

        explanation: {
          type: String,
        },
      },
    ],

    constraints: [
      {
        type: String,
      },
    ],

    starterCode: {
      javascript: {
        type: String,
        default: "",
      },

      cpp: {
        type: String,
        default: "",
      },

      python: {
        type: String,
        default: "",
      },
    },

    solution: {
      javascript: {
        type: String,
        default: "",
      },

      cpp: {
        type: String,
        default: "",
      },

      python: {
        type: String,
        default: "",
      },
    },

    testCases: [
      {
        input: {
          type: String,
          required: true,
        },

        expectedOutput: {
          type: String,
          required: true,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;