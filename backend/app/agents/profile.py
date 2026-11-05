"""Profile agent: turns a CV and test answers into a structured profile.
Tools: parse_cv, score_psychometric, save_profile."""
from __future__ import annotations

import io
import re

from pypdf import PdfReader
from pypdf.errors import PdfReadError

from .. import llm, store
from ..data import IPIP_ITEMS, RIASEC_ITEMS, SCALE, SJT_ITEMS, SKILLS, SKILL_DISPLAY
from ..services import extract_skills

DEGREE = re.compile(r"(B\.?\s?Tech|B\.?E\.?|B\.?Sc|BCA|MCA|M\.?Tech|M\.?Sc|Diploma|B\.?Com|BBA)[^\n,;]{0,40}", re.I)
YEAR = re.compile(r"\b(20[12]\d)\b")


def pdf_text(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
    except (PdfReadError, ValueError) as e:
        raise ValueError("We couldn't read that PDF. Export it again from Word or Google Docs and retry.") from e
    return "\n".join((p.extract_text() or "") for p in reader.pages[:6])


def _rule_parse(text: str) -> dict:
    skills = extract_skills(text)
    deg = DEGREE.search(text)
    years = [int(y) for y in YEAR.findall(text)]
    education = deg.group(0).strip(" -|") if deg else "Education not found"
    if years and deg:
        education = f"{education.split('  ')[0][:30].strip()}, {max(years)}"
    proj_section = re.search(r"projects?\s*\n(.+?)(\n\s*(experience|education|skills|certifications|achievements)\b|\Z)", text, re.I | re.S)
    projects = len(re.findall(r"^\s*(?:[•\-\*▪●]|\d+\.)", proj_section.group(1), re.M)) if proj_section else 0
    if proj_section and projects == 0:
        projects = max(1, min(5, len([l for l in proj_section.group(1).splitlines() if l.strip()]) // 3))
    first_line = next((l.strip() for l in text.splitlines() if l.strip()), "")
    name = first_line.split()[0].title() if first_line and len(first_line) < 40 and not re.search(r"\d|@|resume|curriculum", first_line, re.I) else None
    return dict(skills=skills, education=education, projects=projects, name=name)


async def parse_cv(data: bytes) -> dict:
    text = pdf_text(data)
    if len(text.strip()) < 40:
        raise ValueError("This PDF looks like a scanned image, so we can't read the text. Upload a PDF exported from Word or Google Docs.")
    parsed = _rule_parse(text)
    ai = await llm.ask_json(
        "You extract structured facts from Indian fresher CVs. Use only facts in the CV.",
        "Return {\"name\": first name or null, \"education\": \"degree, graduation year\", \"projects\": number of projects, "
        f"\"skills\": subset of {list(SKILLS)} that the CV shows}}.\n\nCV:\n{text[:8000]}",
        max_tokens=600,
    )
    if isinstance(ai, dict):
        parsed["skills"] = [s for s in ai.get("skills", []) if s in SKILLS] or parsed["skills"]
        parsed["education"] = ai.get("education") or parsed["education"]
        parsed["projects"] = int(ai.get("projects") or parsed["projects"])
        parsed["name"] = ai.get("name") or parsed["name"]
    return parsed


def test_items() -> list[dict]:
    items = [dict(id=f"r{i}", q=q, kind="Interest", options=SCALE) for i, (_, q) in enumerate(RIASEC_ITEMS)]
    items += [dict(id=f"p{i}", q=q, kind="Personality", options=SCALE) for i, (_, _, q) in enumerate(IPIP_ITEMS)]
    items += [dict(id=f"s{i}", q=it["q"], kind="Situation", options=it["options"]) for i, it in enumerate(SJT_ITEMS)]
    return items


def score_psychometric(answers: dict[str, int]) -> dict:
    riasec: dict[str, list[int]] = {}
    for i, (code, _) in enumerate(RIASEC_ITEMS):
        if (v := answers.get(f"r{i}")) is not None:
            riasec.setdefault(code, []).append(v + 1)
    big5: dict[str, list[int]] = {}
    for i, (trait, rev, _) in enumerate(IPIP_ITEMS):
        if (v := answers.get(f"p{i}")) is not None:
            big5.setdefault(trait, []).append(5 - v if rev else v + 1)
    sjt = sum(1 for i, it in enumerate(SJT_ITEMS) if answers.get(f"s{i}") == it["best"])
    r = {k: round(sum(v) / len(v), 2) for k, v in riasec.items()}
    return dict(
        riasec=r,
        big5={k: round(sum(v) / len(v), 2) for k, v in big5.items()},
        sjt=sjt,
        top=max(r, key=r.get) if r else "I",
    )


def save_profile(uid: str, **fields) -> dict:
    user = store.get_user(uid)
    user.update({k: v for k, v in fields.items() if v is not None})
    store.save_user(user)
    return user


def display_skills(keys: list[str]) -> list[str]:
    return [SKILL_DISPLAY.get(k, k) for k in keys]
