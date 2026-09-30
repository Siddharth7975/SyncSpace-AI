import mongoose from "mongoose";
import dotenv from "dotenv";
import Problem from "../../models/Problem.js";

dotenv.config();

const problems = [
  {
    title: "Two Sum",

    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.",

    difficulty: "easy",

    topics: ["Array", "Hash Map"],

    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9.",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6.",
      },
    ],

    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],

    starterCode: {
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,

      javascript: `function twoSum(nums, target) {
    
}`,

      python: `def twoSum(nums, target):
    pass`,
    },

    testCases: [
      {
        input: "nums = [2,7,11,15], target = 9",
        expectedOutput: "[0,1]",
      },
      {
        input: "nums = [3,2,4], target = 6",
        expectedOutput: "[1,2]",
      },
    ],
  },

  {
    title: "Valid Parentheses",

    description:
      "Given a string containing only the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",

    difficulty: "easy",

    topics: ["Stack", "String"],

    examples: [
      {
        input: 's = "()"',
        output: "true",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
      },
      {
        input: 's = "(]"',
        output: "false",
      },
    ],

    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only.",
    ],

    starterCode: {
      cpp: `class Solution {
public:
    bool isValid(string s) {
        
    }
};`,

      javascript: `function isValid(s) {
    
}`,

      python: `def isValid(s):
    pass`,
    },

    testCases: [
      {
        input: 's = "()"',
        expectedOutput: "true",
      },
      {
        input: 's = "()[]{}"',
        expectedOutput: "true",
      },
      {
        input: 's = "(]"',
        expectedOutput: "false",
      },
    ],
  },

  {
    title: "Binary Search",

    description:
      "Given a sorted array of integers nums and an integer target, return the index of target if it exists. Otherwise, return -1.",

    difficulty: "easy",

    topics: ["Array", "Binary Search"],

    examples: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        output: "4",
      },
      {
        input: "nums = [-1,0,3,5,9,12], target = 2",
        output: "-1",
      },
    ],

    constraints: [
      "1 <= nums.length <= 10^4",
      "All integers in nums are unique.",
      "nums is sorted in ascending order.",
    ],

    starterCode: {
      cpp: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        
    }
};`,

      javascript: `function search(nums, target) {
    
}`,

      python: `def search(nums, target):
    pass`,
    },

    testCases: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        expectedOutput: "4",
      },
      {
        input: "nums = [-1,0,3,5,9,12], target = 2",
        expectedOutput: "-1",
      },
    ],
  },

  {
    title: "Reverse Linked List",

    description:
      "Given the head of a singly linked list, reverse the list and return the reversed list.",

    difficulty: "easy",

    topics: ["Linked List", "Recursion"],

    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]",
      },
      {
        input: "head = [1,2]",
        output: "[2,1]",
      },
    ],

    constraints: [
      "The number of nodes is in the range [0, 5000].",
      "-5000 <= Node.val <= 5000",
    ],

    starterCode: {
      cpp: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        
    }
};`,

      javascript: `function reverseList(head) {
    
}`,

      python: `def reverseList(head):
    pass`,
    },

    testCases: [
      {
        input: "head = [1,2,3,4,5]",
        expectedOutput: "[5,4,3,2,1]",
      },
      {
        input: "head = [1,2]",
        expectedOutput: "[2,1]",
      },
    ],
  },

  {
    title: "Maximum Depth of Binary Tree",

    description:
      "Given the root of a binary tree, return its maximum depth.",

    difficulty: "easy",

    topics: ["Binary Tree", "DFS", "BFS"],

    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "3",
      },
      {
        input: "root = [1,null,2]",
        output: "2",
      },
    ],

    constraints: [
      "The number of nodes is in the range [0, 10^4].",
      "-100 <= Node.val <= 100",
    ],

    starterCode: {
      cpp: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        
    }
};`,

      javascript: `function maxDepth(root) {
    
}`,

      python: `def maxDepth(root):
    pass`,
    },

    testCases: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        expectedOutput: "3",
      },
      {
        input: "root = [1,null,2]",
        expectedOutput: "2",
      },
    ],
  },
];

const seedProblems = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    await Problem.deleteMany({});

    await Problem.insertMany(problems);

    console.log(`${problems.length} problems inserted successfully`);

    await mongoose.disconnect();

    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("Problem seeding failed:", error);

    process.exit(1);
  }
};

seedProblems();