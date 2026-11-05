import os
import tempfile

os.environ["SAARATHI_DB"] = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["FETCH_LIVE_JOBS"] = "false"
os.environ["ANTHROPIC_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def make_pdf(text: str) -> bytes:
    """Smallest valid one-page PDF with the given lines of text."""
    lines = text.split("\n")
    stream = "BT /F1 11 Tf 50 780 Td 14 TL " + " ".join(f"({l.replace('(', '').replace(')', '')}) '" for l in lines) + " ET"
    objs = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out, offsets = "%PDF-1.4\n", []
    for i, o in enumerate(objs, 1):
        offsets.append(len(out.encode("latin-1")))
        out += f"{i} 0 obj\n{o}\nendobj\n"
    xref = len(out.encode("latin-1"))
    out += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n" + "".join(f"{o:010d} 00000 n \n" for o in offsets)
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"
    return out.encode("latin-1")


CV = """Rahul Verma
rahul@example.com
Education
B.Tech Computer Science, JNTU Hyderabad, 2026
Skills
Python, SQL, React, Git, HTML, CSS
Projects
- Expense tracker in React with a Flask REST API
- SQL dashboard for college fest registrations
Experience
Intern at a local startup"""


def test_demo_flow_without_cookie():
    c = TestClient(app)
    assert c.get("/health").json()["ok"]
    me = c.get("/me").json()
    assert me["name"] == "Ananya"
    jobs = c.get("/jobs/matches").json()
    assert len(jobs) >= 5 and jobs[0]["match"] >= jobs[-1]["match"]
    assert {"id", "title", "match", "reasons", "gaps", "applyUrl", "round"} <= set(jobs[0])
    items = c.get("/learning/items").json()
    assert items and all(i["url"].startswith("https://") for i in items)
    assert c.get("/plan/today").json()
    assert len(c.get("/plan/week").json()["days"]) == 7


def test_onboarding_creates_own_profile():
    c = TestClient(app)
    r = c.post("/profile/cv", files={"file": ("cv.pdf", make_pdf(CV), "application/pdf")})
    assert r.status_code == 200, r.text
    body = r.json()
    assert {"Python", "SQL", "React", "Git"} <= set(body["skills"])
    assert body["education"].startswith("B.Tech")
    assert body["projects"] == 2
    assert c.cookies.get("saarathi_uid")

    test = c.get("/profile/test").json()
    assert len(test) == 37
    answers = {t["id"]: 3 for t in test}
    r = c.post("/profile", json={"languages": ["English", "हिंदी Hindi"], "minutesPerDay": 60, "answers": answers})
    assert r.json()["psych"]["riasec"]
    me = c.get("/me").json()
    assert me["name"] == "Rahul" and me["minutesPerDay"] == 60

    assert c.put("/jobs/shortlist", json={"ids": ["j4", "nope"]}).json()["shortlist"] == ["j4"]
    skills = {i["skillKey"] for i in c.get("/learning/items").json()}
    assert "excel" in skills  # Junior Data Analyst needs Excel, which the CV lacks


def test_rejects_non_pdf():
    c = TestClient(app)
    r = c.post("/profile/cv", files={"file": ("cv.pdf", b"hello", "application/pdf")})
    assert r.status_code == 415


def test_quiz_grading_updates_gaps():
    c = TestClient(app)
    q = c.get("/quiz/sql").json()["questions"]
    assert "answer" not in q[0]
    r = c.post("/quiz/sql", json={"answers": {x["id"]: 3 for x in q}}).json()
    assert 0 <= r["score"] <= 100 and len(r["results"]) == len(q)


def test_genie_routes_and_flags_distress():
    c = TestClient(app)
    assert "Tele-MANAS" in c.post("/genie", json={"text": "I want to give up", "lang": "en"}).json()["reply"]
    hi = c.post("/genie", json={"text": "आज मुझे क्या करना है?", "lang": "en"}).json()
    assert hi["lang"] == "hi" and hi["agent"] == "today"
    assert c.post("/genie", json={"text": "any new jobs?"}).json()["agent"] == "jobs"


def test_interview_over_websocket_produces_report():
    c = TestClient(app)
    with c.websocket_connect("/interview/test-session-1?round=hr&mode=room") as ws:
        ws.send_json({"type": "start"})
        ev = ws.receive_json()
        assert ev["type"] == "question" and "Ananya" in ev["text"]
        for i in range(20):
            ws.send_json({"type": "metrics", "eyeContact": i % 3 != 0, "faceFound": True, "lookY": -0.2, "slouch": False})
        ws.send_json({"type": "genie_help"})
        assert ws.receive_json()["type"] == "hint"
        answers = [
            "I am a final year computer science student. I built an expense tracker in React because my friends kept losing track of money, and in the end 40 students used it.",
            "ok",  # too short -> follow-up
            "Basically like I think, you know, I like learning and I want to grow with a product team that serves customers.",
        ]
        end = None
        for n in range(12):
            ws.send_json({"type": "answer", "text": answers[n % len(answers)], "seconds": 30})
            ev = ws.receive_json()
            if ev["type"] == "end":
                end = ev
                break
        assert end and end["reportId"]
    rep = c.get(f"/interview/{end['reportId']}/report").json()
    assert 0 < rep["overall"] <= 100
    assert [s["label"] for s in rep["scores"]] == ["Answer quality", "Eye contact", "Voice and pace", "Posture", "Confidence"]
    assert sum(g["value"] for g in rep["gaze"]) == 100
    assert len(rep["fixes"]) == 3 and all(f["lesson"]["url"].startswith("https://") for f in rep["fixes"])


def test_cohort_and_delete():
    c = TestClient(app)
    c.post("/profile", json={"minutesPerDay": 45})
    assert c.get("/cohort").json()["users"] >= 1
    assert c.delete("/profile").json()["ok"]
