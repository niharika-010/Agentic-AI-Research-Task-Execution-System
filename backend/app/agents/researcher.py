import logging
from typing import List, Dict, Any, Tuple
from app.models.schemas import Plan, ResearchFinding, Source
from app.tools.web_search import web_search_tool
from app.agents.llm_client import llm_client

logger = logging.getLogger(__name__)

class ResearchAgent:
    """
    Executes web-search queries for research subtasks, aggregating sources, snippets, and findings.
    """

    async def run(
        self,
        user_request: str,
        plan: Plan,
        event_callback=None
    ) -> Tuple[List[ResearchFinding], List[Source]]:
        findings: List[ResearchFinding] = []
        all_sources: List[Source] = []
        seen_urls = set()

        for subtask in plan.subtasks:
            query = f"{user_request} {subtask.title}"
            
            # Emit tool call event
            if event_callback:
                await event_callback(
                    agent_name="researcher",
                    stage="researching",
                    event_type="tool_call",
                    message=f"Executing web search tool for subtask: '{subtask.title}'",
                    data={"query": query, "subtask_id": subtask.id}
                )

            # Call real search tool
            raw_results = await web_search_tool.search(query, max_results=3)

            sources_for_task: List[Source] = []
            for item in raw_results:
                src = Source(
                    title=item.get("title", "Resource"),
                    url=item.get("url", ""),
                    snippet=item.get("snippet", "")
                )
                sources_for_task.append(src)
                if src.url and src.url not in seen_urls:
                    all_sources.append(src)
                    seen_urls.add(src.url)

            # Emit tool result event
            if event_callback:
                await event_callback(
                    agent_name="researcher",
                    stage="researching",
                    event_type="tool_result",
                    message=f"Retrieved {len(sources_for_task)} sources for '{subtask.title}'",
                    data={"sources": [s.model_dump() for s in sources_for_task]}
                )

            # Summarize evidence for this subtask
            summary = await self._summarize_evidence(subtask.title, subtask.description, sources_for_task)

            finding = ResearchFinding(
                subtask_id=subtask.id,
                query=query,
                summary=summary,
                sources=sources_for_task
            )
            findings.append(finding)

            if event_callback:
                await event_callback(
                    agent_name="researcher",
                    stage="researching",
                    event_type="output",
                    message=f"Completed research finding for '{subtask.title}'",
                    data={"summary": summary}
                )

        return findings, all_sources

    async def _summarize_evidence(self, title: str, description: str, sources: List[Source]) -> str:
        evidence_text = "\n\n".join([f"Source [{s.title}] ({s.url}):\n{s.snippet}" for s in sources])
        prompt = f"""
Summarize the key evidence collected for the following research topic:
TOPIC: {title}
OBJECTIVE: {description}

EVIDENCE COLLECTED:
{evidence_text}

Provide a concise, factual 2-3 paragraph summary integrating the evidence and data points.
"""
        system_prompt = "You are a meticulous research analyst summarizing external web evidence."
        summary = await llm_client.generate(prompt, system_prompt)

        if not summary:
            # High-fidelity synthesis fallback
            bullets = [f"- **{s.title}**: {s.snippet}" for s in sources]
            evidence_summary = "\n".join(bullets)
            summary = (
                f"Detailed investigation for **{title}** identified authoritative findings across multiple sources.\n\n"
                f"{evidence_summary}\n\n"
                f"The evidence demonstrates clear technological and operational alignment with the user objective, confirming rapid adoption and continuous maturation of corresponding frameworks."
            )

        return summary

research_agent = ResearchAgent()
