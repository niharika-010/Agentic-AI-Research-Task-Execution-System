import logging
from datetime import datetime
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from app.orchestration.state import TaskState
from app.models.schemas import Plan, ResearchFinding, AnalysisOutput, Source
from app.agents.planner import planner_agent
from app.agents.researcher import research_agent
from app.agents.analyst import analysis_agent
from app.agents.writer import writer_agent
from app.agents.reviewer import reviewer_agent

logger = logging.getLogger(__name__)

async def planner_node(state: TaskState) -> Dict[str, Any]:
    user_request = state["user_request"]
    plan = await planner_agent.run(user_request)
    return {
        "current_stage": "planning",
        "plan": plan.model_dump(),
    }

async def research_node(state: TaskState) -> Dict[str, Any]:
    user_request = state["user_request"]
    plan = Plan(**state["plan"])
    findings, sources = await research_agent.run(user_request, plan)
    return {
        "current_stage": "researching",
        "research_findings": [f.model_dump() for f in findings],
        "sources": [s.model_dump() for s in sources],
    }

async def analysis_node(state: TaskState) -> Dict[str, Any]:
    user_request = state["user_request"]
    findings = [ResearchFinding(**f) for f in state.get("research_findings", [])]
    analysis = await analysis_agent.run(user_request, findings)
    return {
        "current_stage": "analyzing",
        "analysis": analysis.model_dump(),
    }

async def writer_node(state: TaskState) -> Dict[str, Any]:
    user_request = state["user_request"]
    plan = Plan(**state["plan"])
    findings = [ResearchFinding(**f) for f in state.get("research_findings", [])]
    analysis = AnalysisOutput(**state["analysis"])
    sources = [Source(**s) for s in state.get("sources", [])]
    feedback = state.get("review_feedback")

    draft = await writer_agent.run(
        user_request=user_request,
        plan=plan,
        findings=findings,
        analysis=analysis,
        sources=sources,
        revision_feedback=feedback
    )
    return {
        "current_stage": "writing",
        "draft": draft,
    }

async def reviewer_node(state: TaskState) -> Dict[str, Any]:
    user_request = state["user_request"]
    draft = state.get("draft", "")
    current_revisions = state.get("revision_count", 0)

    verdict = await reviewer_agent.run(
        user_request=user_request,
        draft=draft,
        revision_count=current_revisions
    )

    new_count = current_revisions + (1 if not verdict.passed else 0)

    return {
        "current_stage": "reviewing",
        "review_feedback": verdict.feedback,
        "revision_count": new_count,
        "verdict_passed": verdict.passed
    }

def route_review(state: TaskState) -> Literal["writer_node", "finalize_node"]:
    """
    Reflection rule: If reviewer fails and revision_count <= 1, go back to Writer.
    Otherwise finalize. Cap revision_count at 1 to prevent infinite loops.
    """
    passed = state.get("verdict_passed", True)
    revisions = state.get("revision_count", 0)

    if not passed and revisions <= 1:
        return "writer_node"
    return "finalize_node"

async def finalize_node(state: TaskState) -> Dict[str, Any]:
    return {
        "current_stage": "completed",
        "final_report": state.get("draft", ""),
    }

def build_workflow() -> Any:
    workflow = StateGraph(TaskState)

    workflow.add_node("planner_node", planner_node)
    workflow.add_node("research_node", research_node)
    workflow.add_node("analysis_node", analysis_node)
    workflow.add_node("writer_node", writer_node)
    workflow.add_node("reviewer_node", reviewer_node)
    workflow.add_node("finalize_node", finalize_node)

    workflow.add_edge(START, "planner_node")
    workflow.add_edge("planner_node", "research_node")
    workflow.add_edge("research_node", "analysis_node")
    workflow.add_edge("analysis_node", "writer_node")
    workflow.add_edge("writer_node", "reviewer_node")

    workflow.add_conditional_edges(
        "reviewer_node",
        route_review,
        {
            "writer_node": "writer_node",
            "finalize_node": "finalize_node"
        }
    )

    workflow.add_edge("finalize_node", END)
    return workflow.compile()

research_graph = build_workflow()
