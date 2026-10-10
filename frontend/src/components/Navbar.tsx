import { Bot, History, Sparkles, AlertCircle } from 'lucide-react';

interface NavbarProps {
  onNewTask: () => void;
  onToggleHistory: () => void;
  backendHealthy: boolean;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewTask,
  onToggleHistory,
  backendHealthy,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div 
          onClick={onNewTask}
          className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Bot className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-100 text-lg">
                Agentic<span className="text-indigo-400">AI</span>
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Research & Task Execution System</p>
          </div>
        </div>

        {/* Center: Agent Pipeline Badges */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs text-slate-400">
          <span className="text-slate-500 font-medium">Pipeline:</span>
          <span className="font-semibold text-indigo-300">Planner</span>
          <span className="text-slate-600">→</span>
          <span className="font-semibold text-cyan-300">Researcher</span>
          <span className="text-slate-600">→</span>
          <span className="font-semibold text-amber-300">Analyst</span>
          <span className="text-slate-600">→</span>
          <span className="font-semibold text-emerald-300">Writer</span>
          <span className="text-slate-600">⇄</span>
          <span className="font-semibold text-rose-300">Reviewer</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Health indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {backendHealthy ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">Engine Online</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Connecting...</span>
              </span>
            )}
          </div>

          {/* History Button */}
          <button
            onClick={onToggleHistory}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800"
          >
            <History className="h-3.5 w-3.5 text-slate-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                {historyCount}
              </span>
            )}
          </button>

          {/* New Task Button */}
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
