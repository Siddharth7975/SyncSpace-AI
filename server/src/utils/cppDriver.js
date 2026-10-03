export const generateCppProgram = (problem, userCode) => {
  if (!problem?.execution) {
    throw new Error("Execution metadata is missing for this problem.");
  }

  if (!userCode || !userCode.trim()) {
    throw new Error("C++ code cannot be empty.");
  }

  const { functionName } = problem.execution;

  const commonCode = `
#include <bits/stdc++.h>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;

    ListNode(int x) : val(x), next(nullptr) {}
};

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;

    TreeNode(int x)
        : val(x), left(nullptr), right(nullptr) {}
};

${userCode}

`;

  switch (functionName) {
    case "twoSum":
      return commonCode + generateTwoSumDriver(problem);

    case "isValid":
      return commonCode + generateValidParenthesesDriver(problem);

    case "search":
      return commonCode + generateBinarySearchDriver(problem);

    case "reverseList":
      return commonCode + generateReverseLinkedListDriver(problem);

    case "maxDepth":
      return commonCode + generateMaxDepthDriver(problem);

    default:
      throw new Error(
        `Unsupported C++ function: ${functionName}`
      );
  }
};


// ============================================================
// TWO SUM
// ============================================================

const generateTwoSumDriver = (problem) => {
  const tests = problem.testCases
    .map((testCase, index) => {
      const numsMatch =
        testCase.input.match(/nums\s*=\s*\[([^\]]*)\]/);

      const targetMatch =
        testCase.input.match(/target\s*=\s*(-?\d+)/);

      if (!numsMatch || !targetMatch) {
        throw new Error(
          `Invalid Two Sum test case ${index + 1}`
        );
      }

      const nums = numsMatch[1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const target = targetMatch[1];

      return `
    {
        vector<int> nums = {${nums.join(",")}};
        int target = ${target};

        Solution solution;

        vector<int> result =
            solution.twoSum(nums, target);

        sort(result.begin(), result.end());

        cout << "[";
        for (size_t i = 0; i < result.size(); i++) {
            if (i > 0) cout << ",";
            cout << result[i];
        }
        cout << "]";

        cout << "__TEST_END__";
    }
`;
    })
    .join("\n");

  return `
int main() {

${tests}

    return 0;
}
`;
};


// ============================================================
// VALID PARENTHESES
// ============================================================

const generateValidParenthesesDriver = (problem) => {
  const tests = problem.testCases
    .map((testCase) => {
      const match =
        testCase.input.match(/s\s*=\s*"([\s\S]*)"/);

      if (!match) {
        throw new Error(
          "Invalid Valid Parentheses test case."
        );
      }

      const value = escapeCppString(match[1]);

      return `
    {
        string s = "${value}";

        Solution solution;

        bool result =
            solution.isValid(s);

        cout << (result ? "true" : "false");

        cout << "__TEST_END__";
    }
`;
    })
    .join("\n");

  return `
int main() {

${tests}

    return 0;
}
`;
};


// ============================================================
// BINARY SEARCH
// ============================================================

const generateBinarySearchDriver = (problem) => {
  const tests = problem.testCases
    .map((testCase) => {
      const numsMatch =
        testCase.input.match(
          /nums\s*=\s*\[([^\]]*)\]/
        );

      const targetMatch =
        testCase.input.match(
          /target\s*=\s*(-?\d+)/
        );

      if (!numsMatch || !targetMatch) {
        throw new Error(
          "Invalid Binary Search test case."
        );
      }

      const nums = numsMatch[1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const target = targetMatch[1];

      return `
    {
        vector<int> nums = {${nums.join(",")}};
        int target = ${target};

        Solution solution;

        int result =
            solution.search(nums, target);

        cout << result;

        cout << "__TEST_END__";
    }
`;
    })
    .join("\n");

  return `
int main() {

${tests}

    return 0;
}
`;
};


// ============================================================
// REVERSE LINKED LIST
// ============================================================

const generateReverseLinkedListDriver = (problem) => {
  const tests = problem.testCases
    .map((testCase) => {
      const match =
        testCase.input.match(
          /head\s*=\s*\[([^\]]*)\]/
        );

      if (!match) {
        throw new Error(
          "Invalid Reverse Linked List test case."
        );
      }

      const values = match[1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const insertCode = values
        .map(
          (value, index) =>
            index === 0
              ? `ListNode* head = new ListNode(${value});`
              : `current->next = new ListNode(${value}); current = current->next;`
        )
        .join("\n        ");

      return `
    {
        ListNode* head = nullptr;
        ListNode* current = nullptr;

        ${
          values.length > 0
            ? `
        ${insertCode}
        `
            : ""
        }

        Solution solution;

        ListNode* result =
            solution.reverseList(head);

        cout << "[";

        ListNode* node = result;
        bool first = true;

        while (node != nullptr) {
            if (!first) {
                cout << ",";
            }

            cout << node->val;

            first = false;
            node = node->next;
        }

        cout << "]";

        cout << "__TEST_END__";
    }
`;
    })
    .join("\n");

  return `
int main() {

${tests}

    return 0;
}
`;
};


// ============================================================
// MAXIMUM DEPTH OF BINARY TREE
// ============================================================

const generateMaxDepthDriver = (problem) => {
  const tests = problem.testCases
    .map((testCase) => {
      const match =
        testCase.input.match(
          /root\s*=\s*\[([^\]]*)\]/
        );

      if (!match) {
        throw new Error(
          "Invalid Maximum Depth test case."
        );
      }

      const values = match[1]
        .split(",")
        .map((value) => value.trim());

      const valuesCode = values
        .map(
          (value) =>
            `"${escapeCppString(value)}"`
        )
        .join(",");

      return `
    {
        vector<string> values = {
            ${valuesCode}
        };

        TreeNode* root =
            buildTree(values);

        Solution solution;

        int result =
            solution.maxDepth(root);

        cout << result;

        cout << "__TEST_END__";
    }
`;
    })
    .join("\n");

  return `
TreeNode* buildTree(
    const vector<string>& values
) {
    if (
        values.empty() ||
        values[0] == "null"
    ) {
        return nullptr;
    }

    TreeNode* root =
        new TreeNode(stoi(values[0]));

    queue<TreeNode*> q;

    q.push(root);

    size_t index = 1;

    while (!q.empty() && index < values.size()) {

        TreeNode* current = q.front();
        q.pop();

        if (
            index < values.size() &&
            values[index] != "null"
        ) {
            current->left =
                new TreeNode(stoi(values[index]));

            q.push(current->left);
        }

        index++;

        if (
            index < values.size() &&
            values[index] != "null"
        ) {
            current->right =
                new TreeNode(stoi(values[index]));

            q.push(current->right);
        }

        index++;
    }

    return root;
}

int main() {

${tests}

    return 0;
}
`;
};


// ============================================================
// HELPERS
// ============================================================

const escapeCppString = (value) => {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
};