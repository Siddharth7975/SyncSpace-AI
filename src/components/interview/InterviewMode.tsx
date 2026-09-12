import { Users, UserRound, ArrowLeft } from "lucide-react";

interface InterviewModeProps {
  onBack: () => void;
  onInterviewer: () => void;
  onCandidate: () => void;
}

export default function InterviewMode({
  onBack,
  onInterviewer,
  onCandidate,
}: InterviewModeProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">

        <div className="w-full max-w-4xl">

          {/* Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
              <Users className="w-7 h-7 text-indigo-400" />
            </div>

            <h1 className="text-4xl font-bold mb-3">
              DSA Interview Mode
            </h1>

            <p className="text-slate-400 max-w-xl mx-auto">
              Conduct technical interviews or join an interview
              as a candidate.
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Interviewer */}
            <button
              onClick={onInterviewer}
              className="group text-left bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-7 transition-all hover:bg-slate-900/80"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-5">
                <UserRound className="w-6 h-6 text-indigo-400" />
              </div>

              <h2 className="text-xl font-bold mb-2">
                Interviewer
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Create and conduct a DSA interview. Select
                problems, observe the candidate's solution,
                and evaluate their performance.
              </p>

              <span className="text-sm font-semibold text-indigo-400 group-hover:text-indigo-300">
                Create Interview →
              </span>
            </button>

            {/* Candidate */}
            <button
              onClick={onCandidate}
              className="group text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-7 transition-all hover:bg-slate-900/80"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>

              <h2 className="text-xl font-bold mb-2">
                Candidate
              </h2>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Join an interview using the interview code
                or invitation link provided by the interviewer.
              </p>

              <span className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
                Join Interview →
              </span>
            </button>

          </div>

        </div>

      </main>
    </div>
  );
}