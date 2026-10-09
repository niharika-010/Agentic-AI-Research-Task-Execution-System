import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { TaskInput } from './components/TaskInput';
import { ExecutionMonitor } from './components/ExecutionMonitor';
import { FinalReport } from './components/FinalReport';
import { HistorySidebar } from './components/HistorySidebar';
import { api } from './services/api';
import type { TaskDetail, TaskEvent, TaskSummary } from './types';
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react';

export function App() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    return localStorage.getItem('last_task_id') || null;
  });
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [tasksList, setTasksList] = useState<TaskSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Health check on mount and periodic check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const h = await api.getHealth();
        setBackendHealthy(h.status === 'healthy');
      } catch {
        setBackendHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch task history
  const loadHistory = async () => {
    try {
      const list = await api.listTasks();
      setTasksList(list);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeTaskId]);

  // Save active task ID to localStorage to survive browser refreshes
  useEffect(() => {
    if (activeTaskId) {
      localStorage.setItem('last_task_id', activeTaskId);
    } else {
      localStorage.removeItem('last_task_id');
    }
  }, [activeTaskId]);

  // Polling logic: fetch details and events every 2 seconds if task is active
  useEffect(() => {
    if (!activeTaskId) {
      setTaskDetail(null);
      setEvents([]);
      return;
    }

    let isMounted = true;

    const fetchTaskState = async () => {
      try {
        const [taskData, eventData] = await Promise.all([
          api.getTask(activeTaskId),
          api.getTaskEvents(activeTaskId)
        ]);

        if (isMounted) {
          setTaskDetail(taskData);
          setEvents(eventData);

          // Stop polling if completed or failed
          if (taskData.status === 'completed' || taskData.status === 'failed') {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Polling error', err);
        }
      }
    };

    fetchTaskState();
    pollIntervalRef.current = setInterval(fetchTaskState, 2000);

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeTaskId]);

  const handleCreateTask = async (query: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await api.createTask(query);
      setActiveTaskId(created.id);
      await loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTask = () => {
    setActiveTaskId(null);
    setTaskDetail(null);
    setEvents([]);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation */}
      <Navbar
        onNewTask={handleNewTask}
        onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        backendHealthy={backendHealthy}
        historyCount={tasksList.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {errorMsg && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {!activeTaskId ? (
          /* Submission Screen */
          <TaskInput onSubmit={handleCreateTask} isLoading={isSubmitting} />
        ) : (
          /* Execution & Report Screen */
          <div className="space-y-6">
            {/* Top breadcrumb / Back button */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleNewTask}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Submit another research objective</span>
              </button>

              <div className="text-xs text-slate-500 font-mono">
                Task ID: <span className="text-indigo-400 font-semibold">{activeTaskId}</span>
              </div>
            </div>

            {taskDetail ? (
              <>
                <ExecutionMonitor task={taskDetail} events={events} />

                {/* Final Report (appears once writer produces draft or task completes) */}
                {(taskDetail.final_report || taskDetail.draft_markdown) && (
                  <FinalReport task={taskDetail} />
                )}
              </>
            ) : (
              <div className="py-24 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="mt-4 text-sm text-slate-400 font-medium">
                  Connecting to agent state...
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Task History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        tasks={tasksList}
        activeTaskId={activeTaskId}
        onSelectTask={(id) => setActiveTaskId(id)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-600">
        <p>
          Agentic AI Research & Task Execution System · 5 Specialized Agents with LangGraph Reflection Loop
        </p>
      </footer>
    </div>
  );
}

export default App;
