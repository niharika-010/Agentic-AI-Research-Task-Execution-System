import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.db.database import init_db

init_db()
client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "database" in data

def test_create_and_fetch_task():
    # Test task submission
    payload = {"query": "Evaluate state of quantum machine learning in 2026"}
    res = client.post("/api/tasks", json=payload)
    assert res.status_code == 201
    task = res.json()
    assert "id" in task
    assert task["user_request"] == payload["query"]
    assert task["status"] in ["queued", "planning", "researching", "completed"]

    task_id = task["id"]

    # Test task details fetch
    detail_res = client.get(f"/api/tasks/{task_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == task_id

    # Test task list
    list_res = client.get("/api/tasks")
    assert list_res.status_code == 200
    tasks = list_res.json()
    assert isinstance(tasks, list)
    assert any(t["id"] == task_id for t in tasks)

    # Test events endpoint
    events_res = client.get(f"/api/tasks/{task_id}/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert isinstance(events, list)
    assert len(events) >= 1
