import { runCppCode } from "./cppRunner.js";

const code = `
#include <iostream>

using namespace std;

int main() {
    cout << "Hello from SyncSpace C++ Runner";
    return 0;
}
`;

const result = await runCppCode(code);

console.log("RESULT:");
console.dir(result, { depth: null });