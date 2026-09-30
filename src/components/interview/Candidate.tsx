import { useState, useEffect, useRef } from "react";
import * as Y from "yjs";
import CodeEditor from "../CodeEditor";
import {
  ArrowLeft,
  LogIn,
  Loader2,
  Users,
} from "lucide-react";
import { socket } from "../../services/socketService";

interface CandidateProps {
  token: string;
  onBack: () => void;
}

interface StoredUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
}

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  starterCode?: {
    javascript?: string;
    cpp?: string;
    python?: string;
  };
}

export default function Candidate({
  token,
  onBack,
}: CandidateProps) {
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  // Selected DSA problem
  const [selectedProblem, setSelectedProblem] =
    useState<Problem | null>(null);

  const yDocRef = useRef<Y.Doc>(new Y.Doc());

  /*
   * =========================================================
   * SOCKET EVENT LISTENERS
   * =========================================================
   */

  useEffect(() => {
    const handleInterviewJoined = (data: {
      interviewId: string;
      roomCode: string;
      status: string;
    }) => {
      console.log(
        "✅ CANDIDATE SUCCESSFULLY JOINED INTERVIEW:",
        data
      );

      setLoading(false);
      setJoined(true);
      setError("");
    };

    const handleInterviewError = (data: {
      message: string;
    }) => {
      console.error(
        "❌ INTERVIEW ERROR:",
        data
      );

      setLoading(false);

      setError(
        data.message ||
        "Failed to join interview."
      );
    };

    // ========================================================
    // PROBLEM SELECTED BY INTERVIEWER
    // ========================================================

    const handleProblemSelected = (data: {
      interviewId: string;
      roomCode: string;
      problem: Problem;
    }) => {
      console.log(
        "📚 PROBLEM RECEIVED FROM INTERVIEWER:",
        data
      );

      setSelectedProblem(data.problem);
    };

    socket.on(
      "INTERVIEW_JOINED",
      handleInterviewJoined
    );

    socket.on(
      "INTERVIEW_ERROR",
      handleInterviewError
    );

    socket.on(
      "INTERVIEW_PROBLEM_SELECTED",
      handleProblemSelected
    );

    return () => {
      socket.off(
        "INTERVIEW_JOINED",
        handleInterviewJoined
      );

      socket.off(
        "INTERVIEW_ERROR",
        handleInterviewError
      );

      socket.off(
        "INTERVIEW_PROBLEM_SELECTED",
        handleProblemSelected
      );
    };
  }, []);

  /*
   * =========================================================
   * JOIN INTERVIEW
   * =========================================================
   */

  const handleJoinInterview = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    const code = roomCode
      .trim()
      .toUpperCase();

    /*
     * =======================================================
     * VALIDATE INTERVIEW CODE
     * =======================================================
     */

    if (!code) {
      setError(
        "Please enter an interview code."
      );

      return;
    }

    if (code.length !== 6) {
      setError(
        "Interview code must be 6 characters."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * =====================================================
       * GET LOGGED-IN USER
       * =====================================================
       */

      const storedUser =
        localStorage.getItem(
          "syncspace_user"
        );

      console.log(
        "Candidate localStorage user:",
        storedUser
      );

      if (!storedUser) {
        setError(
          "User information not found. Please login again."
        );

        setLoading(false);

        return;
      }

      const user: StoredUser =
        JSON.parse(storedUser);

      console.log(
        "Candidate parsed user:",
        user
      );

      /*
       * IMPORTANT:
       *
       * Our backend/profile response uses `id`.
       *
       * We also support `_id` in case another
       * response returns MongoDB's `_id`.
       */

      const userId =
        user.id || user._id;

      const username =
        user.name;

      console.log(
        "Candidate user ID:",
        userId
      );

      console.log(
        "Candidate username:",
        username
      );

      /*
       * =====================================================
       * VALIDATE USER INFORMATION
       * =====================================================
       */

      if (!userId) {
        setError(
          "User ID not found. Please logout and login again."
        );

        setLoading(false);

        return;
      }

      if (!username) {
        setError(
          "Username not found. Please logout and login again."
        );

        setLoading(false);

        return;
      }

      /*
       * =====================================================
       * SEND SOCKET EVENT
       * =====================================================
       */

      const joinInterview = () => {
        console.log(
          "🚀 CANDIDATE SOCKET EVENT SENT:",
          {
            roomCode: code,
            userId,
            username,
          }
        );

        socket.emit(
          "INTERVIEW_JOIN",
          {
            roomCode: code,
            userId,
            username,
          }
        );
      };

      /*
       * If Socket.IO is already connected,
       * send the event immediately.
       */

      if (socket.connected) {
        console.log(
          "Socket already connected."
        );

        joinInterview();
      } else {
        /*
         * Otherwise wait for connection.
         */

        console.log(
          "Socket not connected. Connecting..."
        );

        socket.once(
          "connect",
          joinInterview
        );

        socket.connect();
      }
    } catch (error) {
      console.error(
        "❌ Join interview error:",
        error
      );

      setLoading(false);

      setError(
        "Unable to connect to the interview."
      );
    }
  };

  /*
   * =========================================================
   * SUCCESS / JOINED SCREEN
   * =========================================================
   */

  if (joined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">

        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </header>

        {/* Main */}
        <main className="flex-1 p-6">

          <div className="w-full max-w-[1600px] mx-auto">

            {/* Interview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                  DSA Interview
                </p>

                <h1 className="text-2xl font-bold">
                  Candidate Workspace
                </h1>
              </div>

              <div className="flex items-center gap-4">

                {/* Connection */}
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </div>

                {/* Interview Code */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2">
                  <span className="text-xs text-slate-500 mr-2">
                    Code
                  </span>

                  <span className="font-mono font-bold text-emerald-400 tracking-widest">
                    {roomCode}
                  </span>
                </div>

              </div>

            </div>

            {/* ================================================= */}
            {/* WAITING FOR PROBLEM */}
            {/* ================================================= */}

            {!selectedProblem && (
              <div className="min-h-[600px] flex items-center justify-center">

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center max-w-lg">

                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
                    <Users className="w-7 h-7 text-indigo-400" />
                  </div>

                  <h2 className="text-xl font-semibold">
                    Waiting for interviewer
                  </h2>

                  <p className="text-sm text-slate-400 mt-2 leading-6">
                    Your interviewer will select a DSA problem.
                    Once selected, it will appear here and you can
                    start solving it.
                  </p>

                </div>

              </div>
            )}

            {/* ================================================= */}
            {/* INTERVIEW WORKSPACE */}
            {/* ================================================= */}

            {selectedProblem && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ================================================= */}
                {/* LEFT: PROBLEM PANEL */}
                {/* ================================================= */}

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-y-auto max-h-[calc(100vh-150px)]">

                  {/* Problem Header */}
                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                        Interview Problem
                      </p>

                      <h2 className="text-2xl font-bold text-white">
                        {selectedProblem.title}
                      </h2>
                    </div>

                    {/* Difficulty */}
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full border text-xs font-medium capitalize ${selectedProblem.difficulty === "easy"
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : selectedProblem.difficulty === "medium"
                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                        }`}
                    >
                      {selectedProblem.difficulty}
                    </span>

                  </div>

                  {/* Topics */}
                  {selectedProblem.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">

                      {selectedProblem.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400"
                        >
                          {topic}
                        </span>
                      ))}

                    </div>
                  )}

                  {/* Description */}
                  <div className="mt-7">

                    <h3 className="text-sm font-semibold text-slate-300 mb-3">
                      Problem
                    </h3>

                    <p className="text-sm text-slate-400 leading-7 whitespace-pre-line">
                      {selectedProblem.description}
                    </p>

                  </div>

                  {/* Examples */}
                  {selectedProblem.examples?.length > 0 && (
                    <div className="mt-7">

                      <h3 className="text-sm font-semibold text-slate-300 mb-3">
                        Examples
                      </h3>

                      <div className="space-y-3">

                        {selectedProblem.examples.map(
                          (example, index) => (
                            <div
                              key={index}
                              className="bg-slate-950 border border-slate-800 rounded-xl p-4"
                            >

                              <p className="text-sm text-slate-300">
                                <span className="text-slate-500">
                                  Input:
                                </span>{" "}
                                <span className="font-mono">
                                  {example.input}
                                </span>
                              </p>

                              <p className="text-sm text-slate-300 mt-2">
                                <span className="text-slate-500">
                                  Output:
                                </span>{" "}
                                <span className="font-mono">
                                  {example.output}
                                </span>
                              </p>

                              {example.explanation && (
                                <p className="text-sm text-slate-400 mt-3">
                                  <span className="text-slate-500">
                                    Explanation:
                                  </span>{" "}
                                  {example.explanation}
                                </p>
                              )}

                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )}

                  {/* Constraints */}
                  {selectedProblem.constraints?.length > 0 && (
                    <div className="mt-7">

                      <h3 className="text-sm font-semibold text-slate-300 mb-3">
                        Constraints
                      </h3>

                      <ul className="space-y-2">

                        {selectedProblem.constraints.map(
                          (constraint, index) => (
                            <li
                              key={index}
                              className="text-sm text-slate-400 leading-6"
                            >
                              <span className="text-slate-600 mr-2">
                                •
                              </span>

                              {constraint}
                            </li>
                          )
                        )}

                      </ul>

                    </div>
                  )}

                </div>

                {/* ================================================= */}
                {/* RIGHT: CODE EDITOR */}
                {/* ================================================= */}

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[650px]">

                  <CodeEditor
                    yDoc={yDocRef.current}
                    activeUsers={[]}
                    currentUserId="candidate"
                    userName="Candidate"
                    userColor="#6366f1"
                    onSendCursor={() => { }}
                    onSendActivityLog={() => { }}
                    initialCode={
                      selectedProblem.starterCode?.javascript || ""
                    }
                  />

                </div>

              </div>
            )}

          </div>

        </main>

      </div>
    );
  }
  /*
   * =========================================================
   * JOIN INTERVIEW SCREEN
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>

      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">

        <div className="w-full max-w-2xl">

          {/* Heading */}
          <div className="text-center mb-8">

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-5">

              <Users className="w-7 h-7 text-indigo-400" />

            </div>

            <h1 className="text-3xl font-bold">
              Join Interview
            </h1>

            <p className="text-slate-400 mt-2">
              Enter the interview code provided by your interviewer.
            </p>

          </div>

          {/* Candidate Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

            <form
              onSubmit={handleJoinInterview}
              className="space-y-6"
            >

              {/* Interview Code */}
              <div>

                <label
                  htmlFor="roomCode"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Interview Code
                </label>

                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/\s/g, "")
                    )
                  }
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  autoComplete="off"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-4 text-center text-2xl font-mono font-bold tracking-[0.3em] text-white placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-indigo-500 transition-colors"
                />

                <p className="text-xs text-slate-500 mt-2 text-center">
                  Example: ABC123
                </p>

              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  {error}
                </div>
              )}

              {/* Join Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed px-5 py-3 font-semibold transition-colors"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Joining Interview...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />

                    Join Interview
                  </>
                )}

              </button>

            </form>

            {/* Information */}
            <div className="mt-8 pt-6 border-t border-slate-800">

              <div className="flex items-start gap-3">

                <div className="mt-0.5">

                  <Users
                    size={18}
                    className="text-slate-500"
                  />

                </div>

                <div>

                  <p className="text-sm text-slate-300">
                    How it works
                  </p>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Your interviewer will provide a unique
                    interview code. Enter that code above to
                    join the interview session.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}