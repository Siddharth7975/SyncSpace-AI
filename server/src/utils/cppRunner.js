import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";

const TIMEOUT_MS = 3000;

export const runCppCode = async (code) => {
  const tempId =
    crypto.randomBytes(8).toString("hex");

  const tempDir = path.join(
    os.tmpdir(),
    `syncspace-cpp-${tempId}`
  );

  const sourceFile =
    path.join(tempDir, "main.cpp");

  const executableFile =
    path.join(tempDir, "program.exe");

  try {
    // ---------------------------------------------
    // Create temporary directory
    // ---------------------------------------------

    await fs.mkdir(tempDir, {
      recursive: true,
    });

    // ---------------------------------------------
    // Write C++ source code
    // ---------------------------------------------

    await fs.writeFile(
      sourceFile,
      code,
      "utf8"
    );

    // ---------------------------------------------
    // Convert Windows path to MSYS2 path
    // ---------------------------------------------

    const msysSourceFile =
      convertWindowsPathToMsys(
        sourceFile
      );

    const msysExecutableFile =
      convertWindowsPathToMsys(
        executableFile
      );

    // ---------------------------------------------
    // COMPILE
    // ---------------------------------------------

    const compileResult =
      await runProcess(
        "C:\\msys64\\usr\\bin\\bash.exe",
        [
          "-lc",
          `export PATH="/ucrt64/bin:$PATH" && g++ -std=c++17 "${msysSourceFile}" -o "${msysExecutableFile}"`,
        ],
        TIMEOUT_MS
      );

    // ---------------------------------------------
    // Compilation timeout
    // ---------------------------------------------

    if (compileResult.timedOut) {
      return {
        success: false,
        stage: "compile",
        error: "Compilation timed out.",
      };
    }

    // ---------------------------------------------
    // Compilation failed
    // ---------------------------------------------

    if (compileResult.exitCode !== 0) {
      return {
        success: false,
        stage: "compile",
        error:
          compileResult.stderr ||
          compileResult.stdout ||
          "Compilation failed.",
      };
    }

    // ---------------------------------------------
    // Check executable
    // ---------------------------------------------

    const executableExists =
      await fs
        .access(executableFile)
        .then(() => true)
        .catch(() => false);

    console.log(
      "Executable:",
      executableFile
    );

    console.log(
      "Executable exists:",
      executableExists
    );

    if (!executableExists) {
      return {
        success: false,
        stage: "compile",
        error:
          "Compilation completed but executable was not created.",
      };
    }

    // ---------------------------------------------
    // RUN PROGRAM
    // ---------------------------------------------

    const runResult =
      await runProcess(
        executableFile,
        [],
        TIMEOUT_MS
      );

    // ---------------------------------------------
    // Runtime timeout
    // ---------------------------------------------

    if (runResult.timedOut) {
      return {
        success: false,
        stage: "runtime",
        error:
          "Execution timed out. Possible infinite loop.",
      };
    }

    // ---------------------------------------------
    // Runtime error
    // ---------------------------------------------

    if (runResult.exitCode !== 0) {
      return {
        success: false,
        stage: "runtime",
        error:
          runResult.stderr ||
          runResult.stdout ||
          "Program exited with an error.",
        exitCode:
          runResult.exitCode,
        stdout:
          runResult.stdout,
        stderr:
          runResult.stderr,
      };
    }

    // ---------------------------------------------
    // SUCCESS
    // ---------------------------------------------

    return {
      success: true,
      stage: "runtime",
      output:
        runResult.stdout.trim(),
    };

  } catch (error) {

    console.error(
      "C++ runner error:",
      error
    );

    return {
      success: false,
      stage: "runner",
      error:
        error.message ||
        "Failed to run C++ code.",
    };

  } finally {

    // ---------------------------------------------
    // Cleanup
    // ---------------------------------------------

    try {
      await fs.rm(
        tempDir,
        {
          recursive: true,
          force: true,
        }
      );
    } catch (cleanupError) {
      console.error(
        "Failed to clean temporary C++ files:",
        cleanupError
      );
    }
  }
};


// ============================================================
// WINDOWS PATH → MSYS2 PATH
// ============================================================

const convertWindowsPathToMsys = (
  windowsPath
) => {
  const normalizedPath =
    windowsPath.replace(
      /\\/g,
      "/"
    );

  const drive =
    normalizedPath[0].toLowerCase();

  const remainingPath =
    normalizedPath.slice(2);

  return `/${drive}${remainingPath}`;
};


// ============================================================
// RUN PROCESS
// ============================================================

const runProcess = (
  command,
  args,
  timeout
) => {
  return new Promise(
    (resolve) => {

      const child =
        spawn(
          command,
          args,
          {
            windowsHide: true,
          }
        );

      let stdout = "";
      let stderr = "";

      let finished = false;

      // -------------------------------------------
      // Timeout
      // -------------------------------------------

      const timer =
        setTimeout(() => {

          if (finished) {
            return;
          }

          finished = true;

          child.kill();

          resolve({
            exitCode: null,
            stdout,
            stderr,
            timedOut: true,
          });

        }, timeout);


      // -------------------------------------------
      // stdout
      // -------------------------------------------

      child.stdout.on(
        "data",
        (data) => {
          stdout +=
            data.toString();
        }
      );


      // -------------------------------------------
      // stderr
      // -------------------------------------------

      child.stderr.on(
        "data",
        (data) => {
          stderr +=
            data.toString();
        }
      );


      // -------------------------------------------
      // Process error
      // -------------------------------------------

      child.on(
        "error",
        (error) => {

          if (finished) {
            return;
          }

          finished = true;

          clearTimeout(timer);

          resolve({
            exitCode: null,
            stdout,
            stderr:
              error.message,
            timedOut: false,
          });
        }
      );


      // -------------------------------------------
      // Process closed
      // -------------------------------------------

      child.on(
        "close",
        (exitCode) => {

          if (finished) {
            return;
          }

          finished = true;

          clearTimeout(timer);

          resolve({
            exitCode,
            stdout,
            stderr,
            timedOut: false,
          });
        }
      );

    }
  );
};