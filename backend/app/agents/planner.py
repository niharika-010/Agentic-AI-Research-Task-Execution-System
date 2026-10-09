import json
import logging
from typing import Dict, Any
from app.models.schemas import Plan, SubTask
from app.agents.llm_client import llm_client

logger = logging.getLogger(__name__)

class PlannerAgent:
    """
    Decomposes user research query into actionable subtasks with dependencies and assigned roles.
    """

    async def run(self, user_request: str) -> Plan:
        prompt = f"""
You are an expert AI Planner for a multi-agent research system.
Given the user's research request, generate a structured execution plan.
Break down the request into 3 to 4 sequential or parallel subtasks.

USER REQUEST:
"{user_request}"

Return ONLY a valid JSON object matching this structure:
{{
  "goal": "Clear summary of the research goal",
  "subtasks": [
    {{
      "id": "subtask-1",
      "title": "Short descriptive title",
      "description": "Specific investigation directives for this task",
      "dependencies": [],
      "assigned_agent": "researcher",
      "status": "pending"
    }},
    ...
  ]
}}
"""
        system_prompt = "You are a meticulous AI project planner. Always return strict, valid JSON with no markdown fences."
        response_text = await llm_client.generate(prompt, system_prompt)

        if response_text:
            try:
                # Clean any markdown code fences if returned by LLM
                clean_json = response_text.strip()
                if clean_json.startswith("```"):
                    clean_json = clean_json.split("\n", 1)[1]
                    if clean_json.endswith("```"):
                        clean_json = clean_json.rsplit("\n", 1)[0]
                data = json.loads(clean_json)
                return Plan(**data)
            except Exception as e:
                logger.warning(f"Failed to parse LLM plan JSON: {e}. Using structured fallback.")

        # Reliable default decomposition based on the user request
        clean_req = user_request.strip()
        return Plan(
            goal=f"Conduct thorough research, synthesis, and comparative analysis on: {clean_req}",
            subtasks=[
                SubTask(
                    id="subtask-1",
                    title="Domain Exploration & State-of-the-Art Evidence",
                    description=f"Query primary literature, industry benchmarks, and current technical developments regarding {clean_req}.",
                    dependencies=[],
                    assigned_agent="researcher",
                    status="pending"
                ),
                SubTask(
                    id="subtask-2",
                    title="Key Architecture, Capabilities & Limitations",
                    description=f"Identify core architectural paradigms, empirical benefits, trade-offs, and failure modes in {clean_req}.",
                    dependencies=["subtask-1"],
                    assigned_agent="researcher",
                    status="pending"
                ),
                SubTask(
                    id="subtask-3",
                    title="Comparative Synthesis & Strategic Implications",
                    description=f"Analyze collected evidence, discern market trends, synthesize comparative insights, and highlight adoption risks.",
                    dependencies=["subtask-1", "subtask-2"],
                    assigned_agent="analyst",
                    status="pending"
                )
            ]
        )

planner_agent = PlannerAgent()
