import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Search,
  Loader2,
  Code2,
} from "lucide-react";

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  topics: string[];
}

interface ProblemLibraryProps {
  token: string;
  onBack: () => void;
  onSelectProblem: (problem: Problem) => void;
}

export default function ProblemLibrary({
  token,
  onBack,
  onSelectProblem,
}: ProblemLibraryProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/problems",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!data.success) {
          setError(
            data.message || "Failed to load problems."
          );
          return;
        }

        setProblems(data.problems);
      } catch (error) {
        console.error(
          "Fetch problems error:",
          error
        );

        setError(
          "Unable to connect to the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [token]);

  const filteredProblems = problems.filter(
    (problem) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) return true;

      return (
        problem.title
          .toLowerCase()
          .includes(query) ||
        problem.difficulty
          .toLowerCase()
          .includes(query) ||
        problem.topics.some((topic) =>
          topic.toLowerCase().includes(query)
        )
      );
    }
  );

  const getDifficultyStyle = (
    difficulty: Problem["difficulty"]
  ) => {
    if (difficulty === "easy") {
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }

    if (difficulty === "medium") {
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }

    return "text-rose-400 bg-rose-500/10 border-rose-500/20";
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
      <main className="flex-1 p-6">

        <div className="max-w-6xl mx-auto">

          {/* Heading */}
          <div className="mb-8">

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Code2
                  size={22}
                  className="text-indigo-400"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Problem Library
                </h1>

                <p className="text-sm text-slate-400">
                  Choose a DSA problem for the candidate.
                </p>
              </div>
            </div>

          </div>

          {/* Search */}
          <div className="relative mb-6">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by problem, difficulty, or topic..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />

          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-slate-400">

              <Loader2
                size={24}
                className="animate-spin mr-3"
              />

              Loading problems...

            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-400">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            filteredProblems.length === 0 && (
              <div className="text-center py-20">

                <Code2
                  size={40}
                  className="mx-auto text-slate-600 mb-4"
                />

                <h2 className="text-lg font-semibold text-slate-300">
                  No problems found
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Try a different search.
                </p>

              </div>
            )}

          {/* Problems */}
          {!loading &&
            !error &&
            filteredProblems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {filteredProblems.map(
                  (problem) => (
                    <div
                      key={problem._id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
                    >

                      {/* Top row */}
                      <div className="flex items-start justify-between gap-4">

                        <h2 className="text-lg font-semibold text-white">
                          {problem.title}
                        </h2>

                        <span
                          className={`shrink-0 px-3 py-1 rounded-full border text-xs font-medium capitalize ${getDifficultyStyle(
                            problem.difficulty
                          )}`}
                        >
                          {problem.difficulty}
                        </span>

                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-400 mt-3 line-clamp-3">
                        {problem.description}
                      </p>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-2 mt-4">

                        {problem.topics.map(
                          (topic) => (
                            <span
                              key={topic}
                              className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs text-slate-400"
                            >
                              {topic}
                            </span>
                          )
                        )}

                      </div>

                      {/* Select */}
                      <button
                        type="button"
                        onClick={() =>
                          onSelectProblem(
                            problem
                          )
                        }
                        className="w-full mt-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-semibold transition-colors"
                      >
                        Select Problem
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

        </div>

      </main>

    </div>
  );
}