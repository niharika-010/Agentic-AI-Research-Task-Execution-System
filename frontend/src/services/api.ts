import type { TaskSummary, TaskDetail, TaskEvent, TaskResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const api = {
  async getHealth(): Promise<{ status: string; version: string; database: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },

  async createTask(query: string): Promise<TaskSummary> {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create task' }));
      throw new Error(err.detail || 'Failed to create task');
    }
    return res.json();
  },

  async getTask(taskId: string): Promise<TaskDetail> {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}`);
    if (!res.ok) throw new Error(`Failed to fetch task ${taskId}`);
    return res.json();
  },

  async getTaskEvents(taskId: string): Promise<TaskEvent[]> {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/events`);
    if (!res.ok) throw new Error(`Failed to fetch events for task ${taskId}`);
    return res.json();
  },

  async getTaskResult(taskId: string): Promise<TaskResult> {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/result`);
    if (!res.ok) throw new Error(`Failed to fetch result for task ${taskId}`);
    return res.json();
  },

  async listTasks(): Promise<TaskSummary[]> {
    const res = await fetch(`${API_BASE}/api/tasks`);
    if (!res.ok) throw new Error('Failed to list tasks');
    return res.json();
  },
};
