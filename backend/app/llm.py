"""Optional Claude calls for the agents. Returns None when no key is set or the call fails, so every
caller keeps a rule-based path and the app never breaks because of the LLM."""
from __future__ import annotations

import json
import logging
import re

from . import config, store

log = logging.getLogger("saarathi.llm")
_client = None

if config.ANTHROPIC_API_KEY:
    try:
        import anthropic

        _client = anthropic.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY, timeout=30.0, max_retries=1)
    except ImportError:
        log.warning("ANTHROPIC_API_KEY is set but the anthropic package isn't installed; using rules.")


def enabled() -> bool:
    return _client is not None


async def ask(system: str, prompt: str, *, max_tokens: int = 1024, cache_key: str | None = None) -> str | None:
    if _client is None:
        return None
    if cache_key and (hit := store.cache_get("llm:" + cache_key, 7 * 86400)) is not None:
        return hit
    import anthropic

    try:
        res = await _client.beta.messages.create(
            model=config.LLM_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
            betas=["server-side-fallback-2026-07-01"],
            # Short, latency-sensitive replies: low effort. Fallback routes a policy decline to another model.
            extra_body={"output_config": {"effort": "low"}, "fallbacks": "default"},
        )
    except anthropic.RateLimitError:
        log.warning("Claude rate-limited; falling back to rules")
        return None
    except anthropic.APIStatusError as e:
        log.warning("Claude API error %s: %s", e.status_code, e.message)
        return None
    except anthropic.APIConnectionError:
        log.warning("Claude unreachable; falling back to rules")
        return None
    if res.stop_reason == "refusal":
        return None
    text = "".join(b.text for b in res.content if b.type == "text").strip()
    if cache_key and text:
        store.cache_set("llm:" + cache_key, text)
    return text or None


async def ask_json(system: str, prompt: str, **kw) -> dict | list | None:
    text = await ask(system + "\nReply with JSON only, no prose and no code fences.", prompt, **kw)
    if not text:
        return None
    m = re.search(r"[\[{].*[\]}]", text, re.S)
    try:
        return json.loads(m.group(0)) if m else None
    except json.JSONDecodeError:
        return None
