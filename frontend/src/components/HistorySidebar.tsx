import React from 'react';
import type { TaskSummary } from '../types';
import { X, Clock, CheckCircle2, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskSummary[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  tasks,
  activeTaskId,
  onSelectTask,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Research Task History</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No previous research tasks saved yet.
            </div>
          ) : (
            tasks.map((t) => {
              const isSelected = t.id === activeTaskId;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTask(t.id);
                    onClose();
                  }}
                  className={`group cursor-pointer rounded-xl border p-3.5 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">#{t.id}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                      t.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : t.status === 'failed'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {t.status === 'completed' ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : t.status === 'failed' ? (
                        <AlertTriangle className="h-2.5 w-2.5" />
                      ) : (
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                      )}
                      <span className="capitalize">{t.status}</span>
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-indigo-300">
                    {t.user_request}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{new Date(t.created_at).toLocaleString()}</span>
                    <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-slate-300" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
