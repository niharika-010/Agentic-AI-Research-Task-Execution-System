import json
from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import declarative_base, sessionmaker, relationship, Session
from app.core.config import settings

def utc_now():
    return datetime.now(timezone.utc)

# SQLite compatibility check
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Support postgres:// URL format sometimes passed by Render (convert to postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(String(64), primary_key=True, index=True)
    user_request = Column(Text, nullable=False)
    status = Column(String(32), default="queued", index=True)  # queued, planning, researching, analyzing, writing, reviewing, completed, failed
    current_stage = Column(String(32), default="queued")
    revision_count = Column(Integer, default=0)
    
    # JSON serialized artifacts
    plan_json = Column(Text, nullable=True)
    findings_json = Column(Text, nullable=True)
    analysis_json = Column(Text, nullable=True)
    draft_markdown = Column(Text, nullable=True)
    review_feedback = Column(Text, nullable=True)
    final_report = Column(Text, nullable=True)
    sources_json = Column(Text, nullable=True)
    
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    events = relationship("EventModel", back_populates="task", cascade="all, delete-orphan", order_by="EventModel.id")


class EventModel(Base):
    __tablename__ = "task_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(64), ForeignKey("tasks.id"), index=True, nullable=False)
    agent_name = Column(String(32), nullable=False)  # planner, researcher, analyst, writer, reviewer, system
    stage = Column(String(32), nullable=False)
    event_type = Column(String(32), nullable=False)  # started, tool_call, tool_result, output, revision, completed, failed
    message = Column(Text, nullable=False)
    data_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    task = relationship("TaskModel", back_populates="events")


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
