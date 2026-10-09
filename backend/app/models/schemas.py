from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Request schemas
class TaskCreateRequest(BaseModel):
    query: Optional[str] = None
    user_request: Optional[str] = None

    def get_query(self) -> str:
        text = (self.query or self.user_request or "").strip()
        if not text:
            raise ValueError("Query or user_request cannot be empty.")
        return text

# Subtask & Planning schemas
class SubTask(BaseModel):
    id: str
    title: str
    description: str
    dependencies: List[str] = Field(default_factory=list)
    assigned_agent: str  # e.g., 'researcher', 'analyst'
    status: str = "pending"  # pending, in_progress, completed, failed

class Plan(BaseModel):
    goal: str
    subtasks: List[SubTask] = Field(default_factory=list)

# Research Source & Findings
class Source(BaseModel):
    title: str
    url: str
    snippet: str

class ResearchFinding(BaseModel):
    subtask_id: str
    query: str
    summary: str
    sources: List[Source] = Field(default_factory=list)

# Analysis Output
class AnalysisOutput(BaseModel):
    key_findings: List[str] = Field(default_factory=list)
    trends: List[str] = Field(default_factory=list)
    comparative_insights: List[str] = Field(default_factory=list)
    risks_or_gaps: List[str] = Field(default_factory=list)

# Review Verdict
class ReviewVerdict(BaseModel):
    passed: bool
    score: int = Field(ge=0, le=100)
    feedback: str
    revision_instructions: Optional[str] = None

# Event Schema
class EventResponse(BaseModel):
    id: int
    task_id: str
    agent_name: str
    stage: str
    event_type: str
    message: str
    data: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Task Response Schemas
class TaskSummaryResponse(BaseModel):
    id: str
    user_request: str
    status: str
    current_stage: str
    revision_count: int
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class TaskDetailResponse(TaskSummaryResponse):
    plan: Optional[Plan] = None
    findings: Optional[List[ResearchFinding]] = None
    analysis: Optional[AnalysisOutput] = None
    draft_markdown: Optional[str] = None
    review_feedback: Optional[str] = None
    final_report: Optional[str] = None
    sources: Optional[List[Source]] = None

class TaskPlanResponse(BaseModel):
    task_id: str
    status: str
    plan: Optional[Plan] = None

class TaskResultResponse(BaseModel):
    task_id: str
    status: str
    user_request: str
    final_report: Optional[str] = None
    sources: List[Source] = Field(default_factory=list)
    revision_count: int
    review_verdict: Optional[ReviewVerdict] = None
