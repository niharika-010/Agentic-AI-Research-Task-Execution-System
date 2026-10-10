import React from 'react';
import type { 
  TaskDetail, 
  TaskEvent, 
  TaskStatus 
} from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Search, 
  FileText, 
  AlertTriangle, 
  RefreshCw, 
  Bot, 
  ExternalLink, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';

interface ExecutionMonitorProps {
  task: TaskDetail;
  events: TaskEvent[];
}

const STAGES: { key: TaskStatus; label: string; agent: string; icon: any }[] = [
  { key: 'planning', label: '1. Plan', agent: 'Planner', icon: Bot },
  { key: 'researching', label: '2. Research', agent: 'Researcher', icon: Search },
  { key: 'analyzing', label: '3. Analysis', agent: 'Analyst', icon: Cpu },
  { key: 'writing', label: '4. Write', agent: 'Writer', icon: FileText },
  { key: 'reviewing', label: '5. Review', agent: 'Reviewer', icon: ShieldCheck },
  { key: 'completed', label: 'Finalized', agent: 'System', icon: CheckCircle2 },
];

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({ task, events }) => {
  const getStageStatus = (stageKey: TaskStatus): 'done' | 'active' | 'upcoming' => {
    const stageOrder: TaskStatus[] = ['queued', 'planning', 'researching', 'analyzing', 'writing', 'reviewing', 'completed'];
    const currentIdx = stageOrder.indexOf(task.status);
    const targetIdx = stageOrder.indexOf(stageKey);

    if (task.status === 'completed') return 'done';
    if (task.status === 'failed') {
      return currentIdx >= targetIdx ? 'active' : 'upcoming';
    }
    if (currentIdx > targetIdx) return 'done';
    if (currentIdx === targetIdx) return 'active';
    return 'upcoming';
  };

  const agentColor = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'planner': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'researcher': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'analyst': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'writer': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'reviewer': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Query & Status */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Task #{task.id}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                task.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : task.status === 'failed'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
              }`}>
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : task.status === 'failed' ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                )}
                <span className="capitalize">{task.status}</span>
              </span>

              {task.revision_count > 0 && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  Revision #{task.revision_count}
                </span>
              )}
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-bold text-white">
              {task.user_request}
            </h2>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>Started {new Date(task.created_at).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Failure message if any */}
        {task.error_message && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              <span>Execution Error Encountered</span>
            </div>
            <p className="mt-1">{task.error_message}</p>
          </div>
        )}

        {/* Stage Progress Bar / Stepper */}
        <div className="mt-6 border-t border-slate-800/80 pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {STAGES.map((s, idx) => {
              const status = getStageStatus(s.key);
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className={`flex flex-col rounded-xl border p-3 transition-all ${
                    status === 'done'
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                      : status === 'active'
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30 animate-pulse'
                      : 'border-slate-800/80 bg-slate-900/30 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4" />
                    {status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                    {status === 'active' && <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />}
                  </div>
                  <span className="mt-2 text-xs font-semibold">{s.label}</span>
                  <span className="text-[10px] text-slate-400">{s.agent}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Plan breakdown & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Generated Subtask Plan */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Bot className="h-4 w-4 text-indigo-400" />
              <span>Decomposed Execution Plan</span>
            </h3>
            <span className="text-xs text-slate-500">
              {task.plan?.subtasks?.length || 0} Subtasks
            </span>
          </div>

          {task.plan ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-400 italic">
                "{task.plan.goal}"
              </p>
              {task.plan.subtasks.map((st, i) => (
                <div
                  key={st.id || i}
                  className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{st.title}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase font-semibold ${agentColor(st.assigned_agent)}`}>
                      {st.assigned_agent}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-400">{st.description}</p>
                  {st.dependencies && st.dependencies.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                      <span>Depends on:</span>
                      {st.dependencies.map((dep, dIdx) => (
                        <span key={dIdx} className="rounded bg-slate-800 px-1 py-0.2 text-slate-400">
                          {dep}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center text-xs text-slate-500">
              <RefreshCw className="mx-auto h-5 w-5 animate-spin text-indigo-400" />
              <p className="mt-2">Planner Agent analyzing objective...</p>
            </div>
          )}
        </div>

        {/* Right Column (2 cols): Live Agent Events Timeline */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Real-Time Agent Execution Feed</span>
            </h3>
            <span className="text-xs text-slate-500">
              {events.length} Events Logged
            </span>
          </div>

          <div className="mt-4 max-h-[500px] overflow-y-auto space-y-3 pr-1">
            {events.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <p>Waiting for first agent transition event...</p>
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-xs transition-colors hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider ${agentColor(ev.agent_name)}`}>
                        {ev.agent_name}
                      </span>
                      <span className="font-semibold text-slate-300 capitalize">
                        {ev.stage}
                      </span>
                      <span className="rounded bg-slate-800/60 px-1.5 py-0.2 text-[10px] text-slate-400">
                        {ev.event_type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="mt-1.5 text-slate-300 font-medium">{ev.message}</p>

                  {/* Render special data attachments if present */}
                  {ev.data && ev.event_type === 'tool_call' && ev.data.query && (
                    <div className="mt-2 rounded-lg bg-slate-900 border border-slate-800 p-2 text-[11px] text-cyan-300 font-mono flex items-center gap-2">
                      <Search className="h-3 w-3 shrink-0" />
                      <span>QUERY: {ev.data.query}</span>
                    </div>
                  )}

                  {ev.data && ev.event_type === 'tool_result' && ev.data.sources && (
                    <div className="mt-2 space-y-1">
                      {ev.data.sources.slice(0, 2).map((s: any, idx: number) => (
                        <div key={idx} className="rounded bg-slate-900/80 p-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                          <span className="truncate pr-2 font-medium text-slate-300">{s.title}</span>
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline shrink-0 flex items-center gap-1">
                              <span>Link</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {ev.data && ev.event_type === 'revision' && (
                    <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-200">
                      <span className="font-bold">Reviewer Feedback:</span> {ev.data.feedback || ev.data.instructions}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
