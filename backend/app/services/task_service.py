import json
import uuid
import logging
import asyncio
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, TaskModel, EventModel
from app.models.schemas import Plan, ResearchFinding, AnalysisOutput, Source, ReviewVerdict
from app.agents.planner import planner_agent
from app.agents.researcher import research_agent
from app.agents.analyst import analysis_agent
from app.agents.writer import writer_agent
from app.agents.reviewer import reviewer_agent

logger = logging.getLogger(__name__)

class TaskService:

    def create_task(self, db: Session, user_request: str) -> TaskModel:
        task_id = str(uuid.uuid4())[:8]
        task = TaskModel(
            id=task_id,
            user_request=user_request,
            status="queued",
            current_stage="queued",
            revision_count=0,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(task)
        
        # Initial event
        event = EventModel(
            task_id=task_id,
            agent_name="system",
            stage="queued",
            event_type="started",
            message="Task received and queued for execution",
            data_json=json.dumps({"user_request": user_request}),
            created_at=datetime.now(timezone.utc)
        )
        db.add(event)
        db.commit()
        db.refresh(task)
        return task

    def get_task(self, db: Session, task_id: str) -> Optional[TaskModel]:
        return db.query(TaskModel).filter(TaskModel.id == task_id).first()

    def get_task_events(self, db: Session, task_id: str) -> List[EventModel]:
        return db.query(EventModel).filter(EventModel.task_id == task_id).order_by(EventModel.id.asc()).all()

    def list_tasks(self, db: Session, limit: int = 50) -> List[TaskModel]:
        return db.query(TaskModel).order_by(TaskModel.created_at.desc()).limit(limit).all()

    async def log_event(
        self,
        task_id: str,
        agent_name: str,
        stage: str,
        event_type: str,
        message: str,
        data: Optional[Dict[str, Any]] = None
    ):
        db = SessionLocal()
        try:
            event = EventModel(
                task_id=task_id,
                agent_name=agent_name,
                stage=stage,
                event_type=event_type,
                message=message,
                data_json=json.dumps(data) if data else None,
                created_at=datetime.now(timezone.utc)
            )
            db.add(event)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log event for task {task_id}: {e}")
        finally:
            db.close()

    async def execute_task(self, task_id: str):
        """
        Orchestrates the 5-agent pipeline with live persistence, reflection loop,
        and fault-tolerant state tracking.
        """
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if not task:
                logger.error(f"Task {task_id} not found for execution")
                return

            user_request = task.user_request
            db.close()

            # Helper callback for agent events
            async def event_callback(agent_name: str, stage: str, event_type: str, message: str, data=None):
                await self.log_event(task_id, agent_name, stage, event_type, message, data)

            # -------------------------------------------------------------
            # STAGE 1: PLANNER AGENT
            # -------------------------------------------------------------
            await self._update_task_stage(task_id, status="planning", current_stage="planning")
            await event_callback("planner", "planning", "started", "Analyzing objective and creating execution plan")
            
            plan: Plan = await planner_agent.run(user_request)
            
            await self._persist_plan(task_id, plan)
            await event_callback(
                "planner", "planning", "completed",
                f"Generated structured plan with {len(plan.subtasks)} subtasks",
                {"plan": plan.model_dump()}
            )

            # -------------------------------------------------------------
            # STAGE 2: RESEARCH AGENT (With Real Search Tool)
            # -------------------------------------------------------------
            await self._update_task_stage(task_id, status="researching", current_stage="researching")
            await event_callback("researcher", "researching", "started", "Beginning multi-source web intelligence collection")

            findings, sources = await research_agent.run(user_request, plan, event_callback=event_callback)
            
            await self._persist_research(task_id, findings, sources)
            await event_callback(
                "researcher", "researching", "completed",
                f"Completed research with {len(sources)} verified sources across {len(findings)} subtasks",
                {"sources_count": len(sources)}
            )

            # -------------------------------------------------------------
            # STAGE 3: ANALYSIS AGENT
            # -------------------------------------------------------------
            await self._update_task_stage(task_id, status="analyzing", current_stage="analyzing")
            analysis: AnalysisOutput = await analysis_agent.run(user_request, findings, event_callback=event_callback)
            
            await self._persist_analysis(task_id, analysis)
            await event_callback(
                "analyst", "analyzing", "completed",
                f"Identified {len(analysis.key_findings)} core findings and {len(analysis.trends)} industry trends",
                {"analysis": analysis.model_dump()}
            )

            # -------------------------------------------------------------
            # STAGE 4 & 5: WRITER & REVIEWER (With Single Revision Reflection Loop)
            # -------------------------------------------------------------
            revision_count = 0
            max_revisions = 1
            review_feedback = None
            draft = None

            while True:
                # Writer Node
                await self._update_task_stage(task_id, status="writing", current_stage="writing")
                draft = await writer_agent.run(
                    user_request=user_request,
                    plan=plan,
                    findings=findings,
                    analysis=analysis,
                    sources=sources,
                    revision_feedback=review_feedback,
                    event_callback=event_callback
                )
                await self._persist_draft(task_id, draft)

                # Reviewer Node
                await self._update_task_stage(task_id, status="reviewing", current_stage="reviewing")
                verdict: ReviewVerdict = await reviewer_agent.run(
                    user_request=user_request,
                    draft=draft,
                    revision_count=revision_count,
                    event_callback=event_callback
                )

                if verdict.passed or revision_count >= max_revisions:
                    # Finalize
                    await self._persist_review(task_id, verdict.feedback, revision_count)
                    break
                else:
                    # Loop back to Writer once
                    revision_count += 1
                    review_feedback = verdict.feedback
                    await self._persist_review(task_id, review_feedback, revision_count)
                    await event_callback(
                        "system", "reviewing", "revision",
                        f"Routing feedback to Writer Agent for revision iteration {revision_count} of {max_revisions}",
                        {"instructions": verdict.revision_instructions}
                    )

            # -------------------------------------------------------------
            # FINALIZATION
            # -------------------------------------------------------------
            await self._persist_final_report(task_id, draft, revision_count)
            await self._update_task_stage(task_id, status="completed", current_stage="completed")
            await event_callback("system", "completed", "completed", "Research report generated, reviewed, and finalized successfully!")

        except Exception as e:
            logger.exception(f"Unhandled error in task execution {task_id}: {e}")
            await self._fail_task(task_id, str(e))

    async def _update_task_stage(self, task_id: str, status: str, current_stage: str):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.status = status
                task.current_stage = current_stage
                task.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    async def _persist_plan(self, task_id: str, plan: Plan):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.plan_json = json.dumps(plan.model_dump())
                task.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    async def _persist_research(self, task_id: str, findings: List[ResearchFinding], sources: List[Source]):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.findings_json = json.dumps([f.model_dump() for f in findings])
                task.sources_json = json.dumps([s.model_dump() for s in sources])
                task.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    async def _persist_analysis(self, task_id: str, analysis: AnalysisOutput):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.analysis_json = json.dumps(analysis.model_dump())
                task.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    async def _persist_draft(self, task_id: str, draft: str):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.draft_markdown = draft
                task.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    async def _persist_review(self, task_id: str, feedback: str, revision_count: int):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.review_feedback = feedback
                task.revision_count = revision_count
                task.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    async def _persist_final_report(self, task_id: str, final_report: str, revision_count: int):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.final_report = final_report
                task.revision_count = revision_count
                task.updated_at = datetime.now(timezone.utc)
                db.commit()
        finally:
            db.close()

    async def _fail_task(self, task_id: str, error_msg: str):
        db = SessionLocal()
        try:
            task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
            if task:
                task.status = "failed"
                task.current_stage = "failed"
                task.error_message = error_msg
                task.updated_at = datetime.now(timezone.utc)
                db.commit()

            event = EventModel(
                task_id=task_id,
                agent_name="system",
                stage="failed",
                event_type="error",
                message=f"Task execution failed: {error_msg}",
                data_json=json.dumps({"error": error_msg}),
                created_at=datetime.now(timezone.utc)
            )
            db.add(event)
            db.commit()
        finally:
            db.close()

task_service = TaskService()
