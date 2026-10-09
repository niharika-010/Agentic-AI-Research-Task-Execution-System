from typing import List, Optional, Dict, Any
from typing_extensions import TypedDict

class TaskState(TypedDict, total=False):
    task_id: str
    user_request: str
    current_stage: str
    plan: Optional[Dict[str, Any]]
    research_findings: Optional[List[Dict[str, Any]]]
    analysis: Optional[Dict[str, Any]]
    draft: Optional[str]
    review_feedback: Optional[str]
    revision_count: int
    final_report: Optional[str]
    sources: Optional[List[Dict[str, Any]]]
    errors: Optional[List[str]]
    timestamps: Optional[Dict[str, str]]
