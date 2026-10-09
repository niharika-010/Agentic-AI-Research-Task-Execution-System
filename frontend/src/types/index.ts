export type TaskStatus = 
  | 'queued' 
  | 'planning' 
  | 'researching' 
  | 'analyzing' 
  | 'writing' 
  | 'reviewing' 
  | 'completed' 
  | 'failed';

export type SubTask = {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  assigned_agent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
};

export type Plan = {
  goal: string;
  subtasks: SubTask[];
};

export type Source = {
  title: string;
  url: string;
  snippet: string;
};

export type ResearchFinding = {
  subtask_id: string;
  query: string;
  summary: string;
  sources: Source[];
};

export type AnalysisOutput = {
  key_findings: string[];
  trends: string[];
  comparative_insights: string[];
  risks_or_gaps: string[];
};

export type ReviewVerdict = {
  passed: boolean;
  score: number;
  feedback: string;
  revision_instructions?: string | null;
};

export type TaskEvent = {
  id: number;
  task_id: string;
  agent_name: 'planner' | 'researcher' | 'analyst' | 'writer' | 'reviewer' | 'system';
  stage: string;
  event_type: 'started' | 'tool_call' | 'tool_result' | 'output' | 'revision' | 'completed' | 'error';
  message: string;
  data?: any;
  created_at: string;
};

export type TaskSummary = {
  id: string;
  user_request: string;
  status: TaskStatus;
  current_stage: string;
  revision_count: number;
  created_at: string;
  updated_at: string;
  error_message?: string | null;
};

export type TaskDetail = TaskSummary & {
  plan?: Plan | null;
  findings?: ResearchFinding[] | null;
  analysis?: AnalysisOutput | null;
  draft_markdown?: string | null;
  review_feedback?: string | null;
  final_report?: string | null;
  sources?: Source[] | null;
};

export type TaskResult = {
  task_id: string;
  status: TaskStatus;
  user_request: string;
  final_report?: string | null;
  sources: Source[];
  revision_count: number;
  review_verdict?: ReviewVerdict | null;
};
