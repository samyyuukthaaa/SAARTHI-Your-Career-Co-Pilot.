"""Tiny SQLite document store. Mirrors the Supabase tables (users, jobs, sessions, reports,
notifications) so swapping in Supabase later only touches this file."""
from __future__ import annotations

import copy
import json
import sqlite3
import threading
import time
from typing import Any

from . import config
from .data import DEMO_USER, SEED_JOBS

_lock = threading.Lock()
_conn = sqlite3.connect(config.DB_PATH, check_same_thread=False)
_conn.execute("PRAGMA journal_mode=WAL")
_conn.executescript(
    """
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, data TEXT NOT NULL, fetched REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, data TEXT NOT NULL, created REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, data TEXT NOT NULL, created REAL NOT NULL);
    CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, data TEXT NOT NULL, created REAL NOT NULL);
    """
)


def _q(sql: str, args: tuple = ()) -> list[tuple]:
    with _lock:
        cur = _conn.execute(sql, args)
        rows = cur.fetchall()
        _conn.commit()
        return rows


# ---------------------------------------------------------------- users
def get_user(uid: str) -> dict:
    rows = _q("SELECT data FROM users WHERE id=?", (uid,))
    if rows:
        return json.loads(rows[0][0])
    user = copy.deepcopy(DEMO_USER)
    user["id"] = uid
    save_user(user)
    return user


def save_user(user: dict) -> None:
    _q("INSERT OR REPLACE INTO users (id, data) VALUES (?, ?)", (user["id"], json.dumps(user)))


def delete_user(uid: str) -> None:
    for table, col in (("users", "id"), ("sessions", "user_id"), ("reports", "user_id"), ("notifications", "user_id")):
        _q(f"DELETE FROM {table} WHERE {col}=?", (uid,))


def all_users() -> list[dict]:
    return [json.loads(r[0]) for r in _q("SELECT data FROM users")]


# ---------------------------------------------------------------- jobs
def upsert_jobs(jobs: list[dict]) -> None:
    now = time.time()
    for j in jobs:
        _q("INSERT OR REPLACE INTO jobs (id, data, fetched) VALUES (?, ?, ?)", (j["id"], json.dumps(j), now))


def all_jobs() -> list[dict]:
    rows = _q("SELECT data FROM jobs")
    if not rows:
        upsert_jobs(SEED_JOBS)
        rows = _q("SELECT data FROM jobs")
    return [json.loads(r[0]) for r in rows]


def get_job(job_id: str) -> dict | None:
    rows = _q("SELECT data FROM jobs WHERE id=?", (job_id,))
    return json.loads(rows[0][0]) if rows else None


def prune_jobs(max_age_days: int = 30) -> None:
    for j in all_jobs():
        if j.get("posted_days_ago", 0) > max_age_days:
            _q("DELETE FROM jobs WHERE id=?", (j["id"],))


# ---------------------------------------------------------------- interview sessions + reports
def save_session(sid: str, uid: str, data: dict) -> None:
    _q("INSERT OR REPLACE INTO sessions (id, user_id, data) VALUES (?, ?, ?)", (sid, uid, json.dumps(data)))


def get_session(sid: str) -> dict | None:
    rows = _q("SELECT data FROM sessions WHERE id=?", (sid,))
    return json.loads(rows[0][0]) if rows else None


def save_report(rid: str, uid: str, data: dict) -> None:
    _q("INSERT OR REPLACE INTO reports (id, user_id, data, created) VALUES (?, ?, ?, ?)", (rid, uid, json.dumps(data), time.time()))


def get_report(rid: str) -> dict | None:
    rows = _q("SELECT data FROM reports WHERE id=?", (rid,))
    return json.loads(rows[0][0]) if rows else None


def user_reports(uid: str) -> list[dict]:
    return [json.loads(r[0]) for r in _q("SELECT data FROM reports WHERE user_id=? ORDER BY created", (uid,))]


# ---------------------------------------------------------------- notifications + cache
def log_notification(uid: str | None, payload: dict) -> None:
    _q("INSERT INTO notifications (user_id, data, created) VALUES (?, ?, ?)", (uid, json.dumps(payload), time.time()))


def notifications(uid: str) -> list[dict]:
    return [json.loads(r[0]) for r in _q("SELECT data FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 20", (uid,))]


def cache_get(key: str, max_age: float) -> Any | None:
    rows = _q("SELECT data, created FROM cache WHERE key=?", (key,))
    if rows and time.time() - rows[0][1] < max_age:
        return json.loads(rows[0][0])
    return None


def cache_set(key: str, value: Any) -> None:
    _q("INSERT OR REPLACE INTO cache (key, data, created) VALUES (?, ?, ?)", (key, json.dumps(value), time.time()))
