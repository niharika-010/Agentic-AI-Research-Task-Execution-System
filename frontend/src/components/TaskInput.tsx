import { useState } from 'react';
import { Sparkles, ArrowRight, Layers, Compass, Cpu, Search, CheckCircle } from 'lucide-react';

interface TaskInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  "Agentic AI workflows and reflection loops in enterprise production",
  "Comparative benchmark: LangGraph vs AutoGen vs CrewAI for multi-agent systems",
  "Breakthroughs in Quantum Machine Learning and NISQ error mitigation 2026",
  "High-throughput vector search architectures: HNSW vs DiskANN trade-offs",
];

export const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSubmit(query.trim());
  };

  const handleSelectPrompt = (prompt: string) => {
    setQuery(prompt);
  };

  return (
    <div className="mx-auto max-w-4xl py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Multi-Agent Research & Task Execution</span>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Deep Research Powered by{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Specialized Agents
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-400">
          Submit any complex research topic. Five collaborative agents decompose subtasks, execute real-time web retrieval, analyze empirical trends, draft technical reports, and enforce reviewer verification.
        </p>
      </div>

      {/* Input Card */}
      <form onSubmit={handleSubmit} className="mt-8">
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <div className="relative">
            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What research topic or technical objective would you like to investigate?"
              disabled={isLoading}
              className="w-full resize-none bg-transparent px-4 py-3 text-base text-slate-100 placeholder-slate-500 outline-none focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 px-3 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-indigo-400">
                <Search className="h-3.5 w-3.5" /> Live Search Tool
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" /> Reviewer Audit Loop
              </span>
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Orchestrating Agents...</span>
                </>
              ) : (
                <>
                  <span>Start Research</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Prompts */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Or explore curated research scenarios:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPrompt(prompt)}
              className="rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-1.5 text-left text-xs text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800/80"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-slate-200">5 Specialized Agents</h2>
          <p className="mt-1 text-xs text-slate-400">
            Planner breaks goals into subtasks; Researcher pulls live evidence; Analyst draws insights; Writer formats reports; Reviewer enforces quality.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Compass className="h-4 w-4" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-slate-200">Real Web-Search Tool</h2>
          <p className="mt-1 text-xs text-slate-400">
            Live internet integration retrieves current citations, domain snippets, and verifiable source URLs for grounding.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Cpu className="h-4 w-4" />
          </div>
          <h2 className="mt-3 text-sm font-semibold text-slate-200">LangGraph Reflection Loop</h2>
          <p className="mt-1 text-xs text-slate-400">
            Shared state workflow with deterministic reflection: if review rejects the draft, feedback routes back to Writer for a single capped revision.
          </p>
        </div>
      </div>
    </div>
  );
};
