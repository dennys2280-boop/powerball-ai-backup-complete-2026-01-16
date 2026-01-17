from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple
from urllib.parse import urlparse


@dataclass(frozen=True)
class Draw:
    draw_date: str  # YYYY-MM-DD
    white1: int
    white2: int
    white3: int
    white4: int
    white5: int
    powerball: int

    @property
    def whites(self) -> Tuple[int, int, int, int, int]:
        return (self.white1, self.white2, self.white3, self.white4, self.white5)


def _project_root_from_here() -> Path:
    # .../powerball_api/src/ai_assistants/data_access.py -> .../powerball_api
    return Path(__file__).resolve().parents[2]


def resolve_sqlite_path() -> Path:
    db_url = os.getenv("DATABASE_URL", "").strip()
    if db_url:
        parsed = urlparse(db_url)
        if (parsed.scheme or "").startswith("sqlite") and parsed.path:
            p = Path(parsed.path)
            if p.exists():
                return p

    root = _project_root_from_here()
    p1 = root / "data" / "powerball.db"
    if p1.exists():
        return p1

    p2 = root / "powerball.db"
    if p2.exists():
        return p2

    return Path("./powerball.db").resolve()


def _connect(db_path: Path) -> sqlite3.Connection:
    return sqlite3.connect(str(db_path))


def fetch_last_draws(n: int, until_date: Optional[str] = None, require_complete: bool = True) -> List[Draw]:
    db_path = resolve_sqlite_path()
    conn = _connect(db_path)
    try:
        where = []
        params = []
        if until_date:
            where.append("draw_date <= ?")
            params.append(until_date)

        if require_complete:
            where.extend([
                "white1 IS NOT NULL", "white2 IS NOT NULL", "white3 IS NOT NULL",
                "white4 IS NOT NULL", "white5 IS NOT NULL", "powerball IS NOT NULL",
            ])

        sql = """
            SELECT draw_date, white1, white2, white3, white4, white5, powerball
            FROM draws
        """
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY draw_date DESC LIMIT ?"
        params.append(int(n))

        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()

        return [
            Draw(
                draw_date=str(r[0]),
                white1=int(r[1]), white2=int(r[2]), white3=int(r[3]),
                white4=int(r[4]), white5=int(r[5]),
                powerball=int(r[6]),
            )
            for r in rows
        ]
    finally:
        conn.close()


def fetch_all_draws(require_complete: bool = True) -> List[Draw]:
    db_path = resolve_sqlite_path()
    conn = _connect(db_path)
    try:
        where = []
        if require_complete:
            where.extend([
                "white1 IS NOT NULL", "white2 IS NOT NULL", "white3 IS NOT NULL",
                "white4 IS NOT NULL", "white5 IS NOT NULL", "powerball IS NOT NULL",
            ])

        sql = """
            SELECT draw_date, white1, white2, white3, white4, white5, powerball
            FROM draws
        """
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY draw_date ASC"

        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()

        return [
            Draw(
                draw_date=str(r[0]),
                white1=int(r[1]), white2=int(r[2]), white3=int(r[3]),
                white4=int(r[4]), white5=int(r[5]),
                powerball=int(r[6]),
            )
            for r in rows
        ]
    finally:
        conn.close()


def fetch_same_month_day(target_date: str, require_complete: bool = True) -> List[Draw]:
    mmdd = target_date[5:10]  # "MM-DD"
    db_path = resolve_sqlite_path()
    conn = _connect(db_path)
    try:
        where = ["substr(draw_date, 6, 5) = ?"]
        params = [mmdd]

        if require_complete:
            where.extend([
                "white1 IS NOT NULL", "white2 IS NOT NULL", "white3 IS NOT NULL",
                "white4 IS NOT NULL", "white5 IS NOT NULL", "powerball IS NOT NULL",
            ])

        sql = """
            SELECT draw_date, white1, white2, white3, white4, white5, powerball
            FROM draws
            WHERE
        """ + " AND ".join(where) + " ORDER BY draw_date ASC"

        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()

        return [
            Draw(
                draw_date=str(r[0]),
                white1=int(r[1]), white2=int(r[2]), white3=int(r[3]),
                white4=int(r[4]), white5=int(r[5]),
                powerball=int(r[6]),
            )
            for r in rows
        ]
    finally:
        conn.close()


def fetch_same_weekday(target_date: str, require_complete: bool = True) -> List[Draw]:
    """
    weekday SQLite: strftime('%w', date) -> 0=Sunday..6=Saturday
    """
    db_path = resolve_sqlite_path()
    conn = _connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute("SELECT strftime('%w', ?) as wd", (target_date,))
        wd = cur.fetchone()[0]

        where = ["strftime('%w', draw_date) = ?"]
        params = [wd]

        if require_complete:
            where.extend([
                "white1 IS NOT NULL", "white2 IS NOT NULL", "white3 IS NOT NULL",
                "white4 IS NOT NULL", "white5 IS NOT NULL", "powerball IS NOT NULL",
            ])

        sql = """
            SELECT draw_date, white1, white2, white3, white4, white5, powerball
            FROM draws
            WHERE
        """ + " AND ".join(where) + " ORDER BY draw_date ASC"

        cur.execute(sql, params)
        rows = cur.fetchall()

        return [
            Draw(
                draw_date=str(r[0]),
                white1=int(r[1]), white2=int(r[2]), white3=int(r[3]),
                white4=int(r[4]), white5=int(r[5]),
                powerball=int(r[6]),
            )
            for r in rows
        ]
    finally:
        conn.close()
