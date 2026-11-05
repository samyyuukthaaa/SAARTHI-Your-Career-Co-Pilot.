"""Genie (orchestrator): the assistant on every page. Detects language and distress, routes the
request to the right agent and replies in the user's language.
Tools: route_to_agent, get_today_tasks, get_new_jobs, detect_language, flag_distress, queue_notification."""
from __future__ import annotations

import re

from .. import llm, store
from ..services import queue_notification
from . import job_matcher, prep_planner

DISTRESS = re.compile(r"give up|hopeless|can'?t do this|worthless|nervous|anxious|scared|panic|depress|stress|suicid|kill myself|घबरा|डर|हार मान|तनाव|परेशान", re.I)
SEVERE = re.compile(r"suicid|kill myself|end my life|no reason to live|मर जा|जान दे", re.I)
INTENTS = [
    ("today", re.compile(r"today|what (do|should) i do|plan|aaj|आज|क्या करना|task", re.I)),
    ("jobs", re.compile(r"job|opening|naukri|नौकरी|apply|company|vacanc", re.I)),
    ("report", re.compile(r"report|score|how did i|last interview|रिपोर्ट|स्कोर", re.I)),
    ("learn", re.compile(r"learn|course|lecture|study|पढ़|सीख", re.I)),
    ("explain", re.compile(r"explain|what is|what are|difference|समझा|क्या है|kya hai", re.I)),
]
TELE_MANAS = {
    "en": "That's a very normal feeling before interviews. Let's take three slow breaths together: in for four, hold for four, out for six. If it feels heavy, Tele-MANAS is free and confidential, any time: call 14416.",
    "hi": "इंटरव्यू से पहले घबराहट होना बिल्कुल सामान्य है। चलिए साथ में तीन धीमी साँसें लेते हैं: चार तक अंदर, चार तक रोकें, छह तक बाहर। अगर बोझ भारी लगे, तो Tele-MANAS 14416 पर कभी भी मुफ़्त और गोपनीय बात कर सकते हैं।",
}
SEVERE_REPLY = {
    "en": "I'm really glad you told me. You don't have to carry this alone. Please call Tele-MANAS on 14416 right now; it's free, confidential and open 24 hours. If you are in immediate danger, call 112.",
    "hi": "आपने बताया, यह बहुत अच्छा किया। आपको यह अकेले नहीं झेलना है। कृपया अभी Tele-MANAS 14416 पर कॉल करें; यह मुफ़्त, गोपनीय और 24 घंटे खुला है। अगर तुरंत ख़तरा है तो 112 पर कॉल करें।",
}


def detect_language(text: str, fallback: str) -> str:
    if re.search(r"[ऀ-ॿ]", text):
        return "hi"
    if re.search(r"\b(kya|mujhe|aaj|naukri|kaise|hai|nahi|karna)\b", text, re.I):
        return "hi"
    return fallback


async def reply(user: dict, text: str, lang: str) -> dict:
    lang = detect_language(text, lang if lang in ("en", "hi") else "en")
    if SEVERE.search(text):
        await queue_notification(user["id"], "internal", "distress_flag", {"severity": "high"})
        return dict(reply=SEVERE_REPLY[lang], agent="genie", distress=True, lang=lang)
    if DISTRESS.search(text):
        return dict(reply=TELE_MANAS[lang], agent="genie", distress=True, lang=lang)

    intent = next((name for name, rx in INTENTS if rx.search(text)), None)
    context = {}
    if intent in (None, "today"):
        tasks = await prep_planner.today(user)
        context["today"] = [f"{t['title']} ({t['minutes']} min)" for t in tasks]
    if intent in (None, "jobs"):
        context["jobs"] = [f"{j['title']} at {j['company']}, {j['match']}% match" for j in job_matcher.ranked(user, 3)]
    if intent == "report":
        reports = store.user_reports(user["id"])
        context["report"] = reports[-1] if reports else None

    if llm.enabled():
        ai = await llm.ask(
            "You are Saarathi, a warm career copilot for first-time coders in India. Reply in "
            + ("simple Hindi (Devanagari)" if lang == "hi" else "simple English")
            + ". At most 3 short sentences, sized for a phone. Use only facts in the context; never invent jobs, links or numbers. "
            "Stay on careers, learning and interviews. If someone seems distressed, mention Tele-MANAS 14416.",
            f"Context: {context}\nStudent: {text}",
            max_tokens=400,
        )
        if ai:
            return dict(reply=ai, agent=intent or "genie", distress=False, lang=lang)

    return dict(reply=_rule_reply(intent, context, lang), agent=intent or "genie", distress=False, lang=lang)


def _rule_reply(intent: str | None, ctx: dict, lang: str) -> str:
    hi = lang == "hi"
    if intent == "today" and ctx.get("today"):
        items = ctx["today"][:3]
        return ("आज: " if hi else "Today: ") + "; ".join(items) + "."
    if intent == "jobs" and ctx.get("jobs"):
        return (f"आपके लिए सबसे अच्छा मैच: {ctx['jobs'][0]}। Jobs पेज पर और भी हैं।" if hi
                else f"Your best match right now: {ctx['jobs'][0]}. There are more on the Jobs page.")
    if intent == "report":
        r = ctx.get("report")
        if not r:
            return "अभी तक कोई इंटरव्यू नहीं हुआ। इंटरव्यू रूम में एक HR राउंड आज़माएँ।" if hi else "You haven't done an interview yet. Try one HR round in the interview room."
        return (f"पिछला इंटरव्यू: {r['overall']}/100। सबसे पहले सुधारें: {r['fixes'][0]['title']}।" if hi
                else f"Your last interview scored {r['overall']}. First thing to fix: {r['fixes'][0]['title']}.")
    if intent == "learn":
        return "Learn पेज पर आपकी स्किल गैप के लिए मुफ़्त लेक्चर हैं, आपकी भाषा में।" if hi else "Your Learn page has free lectures for each skill gap, in your languages. Start with the first one."
    if intent == "explain":
        return ("मैं अभी ऑफ़लाइन मोड में हूँ। Learn पेज पर इस विषय का लेक्चर खोलें।" if hi
                else "I'm running in offline mode, so I can't explain topics in depth yet. Open the matching lecture on your Learn page.")
    return ("मैं बता सकता हूँ कि आज क्या करना है, नई नौकरियाँ, या आपकी पिछली रिपोर्ट।" if hi
            else "I can tell you what to do today, find new jobs, or go over your last interview report.")
