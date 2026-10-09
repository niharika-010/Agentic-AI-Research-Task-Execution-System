import sys
import os
import pytest
import asyncio

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.agents.planner import planner_agent
from app.agents.researcher import research_agent
from app.agents.analyst import analysis_agent
from app.agents.writer import writer_agent
from app.agents.reviewer import reviewer_agent
from app.models.schemas import Plan, Source

@pytest.mark.asyncio
async def test_planner_agent():
    query = "Autonomous AI Agent architectures in enterprise"
    plan = await planner_agent.run(query)
    assert isinstance(plan, Plan)
    assert len(plan.subtasks) >= 2
    assert plan.subtasks[0].id == "subtask-1"
    assert plan.subtasks[0].assigned_agent in ["researcher", "analyst"]

@pytest.mark.asyncio
async def test_reviewer_reflection_cap():
    query = "Test agentic reflection rules"
    draft = "Preliminary draft on agentic systems..."
    
    # Pass 1: Reviewer should request revision
    verdict1 = await reviewer_agent.run(query, draft, revision_count=0)
    assert verdict1.passed is False
    assert verdict1.feedback is not None

    # Pass 2: Reviewer must pass because revision_count >= 1 (reflection rule)
    verdict2 = await reviewer_agent.run(query, draft, revision_count=1)
    assert verdict2.passed is True
    assert verdict2.score >= 80

@pytest.mark.asyncio
async def test_writer_and_sources():
    query = "Edge AI Inference performance"
    plan = await planner_agent.run(query)
    findings, sources = await research_agent.run(query, plan)
    analysis = await analysis_agent.run(query, findings)
    
    assert len(findings) > 0
    assert len(sources) > 0
    assert len(analysis.key_findings) > 0

    report = await writer_agent.run(query, plan, findings, analysis, sources)
    assert len(report) > 100
    assert "Executive Summary" in report
    assert "References & Citations" in report
