import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  Loader2,
} from "lucide-react";
import { createInterview } from "../../services/interviewService";

interface InterviewerProps {
  token: string;
  onBack: () => void;
}

export default function Interviewer({
  token,
  onBack,
}: InterviewerProps) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleCreateInterview = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await createInterview(token);

      if (!data.success) {
        setError(data.message || "Failed to create interview.");
        return;
      }

      setRoomCode(data.interview.roomCode);
    } catch (error) {
      console.error("Create interview error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;

    await navigator.clipboard.writeText(roomCode);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

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

            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-5">
              <Users className="w-7 h-7 text-emerald-400" />
            </div>

            <h1 className="text-3xl font-bold">
              Create Interview
            </h1>

            <p className="text-slate-400 mt-2">
              Create a new DSA interview and invite a candidate.
            </p>

          </div>

          {/* Interview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

            {!roomCode ? (
              <div className="text-center">

                <h2 className="text-xl font-semibold mb-2">
                  Ready to start?
                </h2>

                <p className="text-sm text-slate-400 mb-7">
                  Create an interview session to generate a
                  unique interview code.
                </p>

                {error && (
                  <div className="mb-5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCreateInterview}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed px-5 py-3 font-semibold transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Creating Interview...
                    </>
                  ) : (
                    "Create Interview"
                  )}
                </button>

              </div>
            ) : (
              <div className="text-center">

                {/* Created State */}
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Interview Created
                </div>

                <h2 className="text-xl font-semibold">
                  Invite your candidate
                </h2>

                <p className="text-sm text-slate-400 mt-2 mb-6">
                  Share this interview code with your candidate.
                </p>

                {/* Interview Code */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">

                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                    Interview Code
                  </p>

                  <div className="text-4xl font-mono font-bold tracking-[0.3em] text-emerald-400">
                    {roomCode}
                  </div>

                </div>

                {/* Copy Code */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-3 font-semibold transition-colors"
                >
                  {copied ? (
                    <>
                      <Check
                        size={18}
                        className="text-emerald-400"
                      />
                      Code Copied
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Interview Code
                    </>
                  )}
                </button>

                {/* Waiting */}
                <div className="mt-8 pt-6 border-t border-slate-800">

                  <div className="flex items-center justify-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Waiting for candidate
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    The candidate will appear here after joining.
                  </p>

                </div>

              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}