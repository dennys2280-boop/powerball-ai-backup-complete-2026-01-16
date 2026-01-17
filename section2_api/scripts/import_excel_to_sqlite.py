from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = PROJECT_ROOT / "data" / "powerball.db"

COLUMN_ALIASES: Dict[str, List[str]] = {
    "draw_date": ["draw_date", "date", "drawdate", "draw date", "fecha"],
    "white1": ["white1", "w1", "ball1", "b1", "n1", "num1", "white_1"],
    "white2": ["white2", "w2", "ball2", "b2", "n2", "num2", "white_2"],
    "white3": ["white3", "w3", "ball3", "b3", "n3", "num3", "white_3"],
    "white4": ["white4", "w4", "ball4", "b4", "n4", "num4", "white_4"],
    "white5": ["white5", "w5", "ball5", "b5", "n5", "num5", "white_5"],
    "powerball": ["powerball", "pb", "red", "redball", "power ball", "bola roja"],
    "power_play": ["power_play", "powerplay", "pp", "power play"],
}


def _norm(s: str) -> str:
    return "".join(ch.lower() for ch in str(s).strip())


def _find_col(df_cols: List[str], candidates: List[str]) -> Optional[str]:
    norm_map = {_norm(c): c for c in df_cols}
    for cand in candidates:
        key = _norm(cand)
        if key in norm_map:
            return norm_map[key]
    return None


def _standardize(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    cols = list(df.columns)
    missing = []
    rename = {}

    for std, aliases in COLUMN_ALIASES.items():
        found = _find_col(cols, aliases)
        if found:
            rename[found] = std
        else:
            if std in ("white1",):  # mínimo para first-position
                missing.append(std)

    df = df.rename(columns=rename)
    return df, missing


def _int_or_none(v):
    try:
        if v is None or str(v) == "<NA>":
            return None
        return int(v)
    except Exception:
        return None


def _looks_like_numbers_export(df: pd.DataFrame) -> bool:
    """
    Detecta el caso típico exportado desde Apple Numbers:
    columnas como 'Table 1' + 'Unnamed: X' en vez de headers reales.
    """
    cols = [str(c) for c in df.columns]
    if not cols:
        return False

    has_table = any(c.strip().lower() == "table 1" for c in cols)
    has_unnamed = any("unnamed:" in c.strip().lower() for c in cols)
    missing_white1 = _find_col(list(df.columns), COLUMN_ALIASES["white1"]) is None

    return (has_table or has_unnamed) and missing_white1


def _read_excel_with_fallback(excel_path: Path) -> pd.DataFrame:
    import pandas as pd

    # 1) Leer Excel (primera hoja)
    df = pd.read_excel(excel_path)

    # 2) Normalizar columnas
    df.columns = df.columns.str.strip().str.lower()

    # 3) Validar columnas oficiales
    required = ["drawdate", "ball1", "ball2", "ball3", "ball4", "ball5", "powerball"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Faltan columnas requeridas: {missing}. Encontradas: {list(df.columns)}")

    # 4) Convertir fecha (FAIL FAST)
    df["draw_date"] = pd.to_datetime(
        df["drawdate"],
        format="%Y-%m-%d",
        errors="raise"
    )

    # 5) Renombrar bolas al esquema interno
    df = df.rename(columns={
        "ball1": "white1",
        "ball2": "white2",
        "ball3": "white3",
        "ball4": "white4",
        "ball5": "white5",
    })

    # 6) Eliminar solo filas inválidas (NO dropna global)
    df = df.dropna(subset=[
        "draw_date",
        "white1",
        "white2",
        "white3",
        "white4",
        "white5",
        "powerball",
    ])

    return df


def import_excel(excel_path: Path, db_path: Path = DEFAULT_DB) -> None:
    if not excel_path.exists():
        raise SystemExit(f"No existe el Excel: {excel_path}")

    db_path.parent.mkdir(parents=True, exist_ok=True)

    # ✅ Lectura con fallback para export de Numbers
    df = _read_excel_with_fallback(excel_path)

    if df is None or df.empty:
        raise SystemExit("El Excel está vacío o no se pudo leer.")

    df, missing = _standardize(df)
    if missing:
        raise SystemExit(
            "Faltan columnas mínimas: " + ", ".join(missing) +
            "\nColumnas detectadas: " + ", ".join(map(str, df.columns))
        )

    keep = [c for c in ["draw_date", "white1", "white2", "white3", "white4", "white5", "powerball", "power_play"] if c in df.columns]
    df = df[keep].copy()

    for c in ["white1", "white2", "white3", "white4", "white5", "powerball", "power_play"]:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").astype("Int64")

    if "draw_date" in df.columns:
        df["draw_date"] = pd.to_datetime(df["draw_date"], errors="coerce").dt.date.astype(str)

    conn = sqlite3.connect(str(db_path))
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS draws (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                draw_date TEXT,
                white1 INTEGER,
                white2 INTEGER,
                white3 INTEGER,
                white4 INTEGER,
                white5 INTEGER,
                powerball INTEGER,
                power_play INTEGER
            );
        """)
        conn.commit()

        cur.execute("DELETE FROM draws;")
        conn.commit()

        rows = df.to_dict(orient="records")
        for r in rows:
            cur.execute("""
                INSERT INTO draws (draw_date, white1, white2, white3, white4, white5, powerball, power_play)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r.get("draw_date"),
                _int_or_none(r.get("white1")),
                _int_or_none(r.get("white2")),
                _int_or_none(r.get("white3")),
                _int_or_none(r.get("white4")),
                _int_or_none(r.get("white5")),
                _int_or_none(r.get("powerball")),
                _int_or_none(r.get("power_play")),
            ))
        conn.commit()
        print(f"OK: importados {len(rows)} draws a {db_path}")
    finally:
        conn.close()


if __name__ == "__main__":
    excel = os.getenv("EXCEL_PATH")
    if not excel:
        raise SystemExit("Define EXCEL_PATH con la ruta del Excel.")
    import_excel(Path(excel))
