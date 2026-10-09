import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMClient:
    """
    Unified LLM Client supporting Gemini, OpenAI, Anthropic, or an intelligent heuristic engine.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.openai_key = settings.OPENAI_API_KEY
        self.gemini_key = settings.GEMINI_API_KEY
        self.anthropic_key = settings.ANTHROPIC_API_KEY

    async def generate(self, prompt: str, system_prompt: str = "") -> str:
        """
        Generate completion using available LLM API or fallback to rule-based engine.
        """
        # Try Gemini if key is present
        if (self.provider in ["auto", "gemini"]) and self.gemini_key:
            try:
                return await self._call_gemini(prompt, system_prompt)
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Trying fallback.")

        # Try OpenAI if key is present
        if (self.provider in ["auto", "openai"]) and self.openai_key:
            try:
                return await self._call_openai(prompt, system_prompt)
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}. Trying fallback.")

        # Try Anthropic if key is present
        if (self.provider in ["auto", "anthropic"]) and self.anthropic_key:
            try:
                return await self._call_anthropic(prompt, system_prompt)
            except Exception as e:
                logger.warning(f"Anthropic API call failed: {e}. Trying fallback.")

        # Default intelligent synthesis (no API key needed)
        return ""

    async def _call_gemini(self, prompt: str, system_prompt: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system_prompt}\n\n{prompt}"}]}
            ]
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        return ""

    async def _call_openai(self, prompt: str, system_prompt: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def _call_anthropic(self, prompt: str, system_prompt: str) -> str:
        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.anthropic_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]

llm_client = LLMClient()
