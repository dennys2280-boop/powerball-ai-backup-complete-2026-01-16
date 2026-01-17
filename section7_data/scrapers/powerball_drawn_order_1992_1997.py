import re
import time
import random
from typing import List, Dict, Optional

import requests
from bs4 import BeautifulSoup
import pandas as pd

BASE = "https://www.lottoamerica.com"

INPUT_DATES_CSV = "powerball_draw_order_1992_to_date.csv"
OUT_CSV = "powerball_drawn_order_1992_1997.csv"
OUT_XLSX = "powerball_drawn_order_1992_1997.xlsx"

START_DATE = "1992-04-22"
END_DATE = "1997-10-29"  # antes de 1997-11-01

session = requests.Session()
session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
    "Referer": BASE + "/",
    "Connection": "keep-alive",
})

def fetch(url: str, retries: int = 6) -> str:
    """
    Fetch con backoff para manejar bloqueos temporales.
    """
    for attempt in range(1, retries + 1):
        r = session.get(url, timeout=30)

        # Si nos tiran 403, esperamos y reintentamos (a veces se “desbloquea”)
        if r.status_code == 403:
            wait = 10 * attempt + random.uniform(0, 5)
            print(f"403 en {url} -> esperando {wait:.1f}s y reintentando ({attempt}/{retries})")
            time.sleep(wait)
            continue

        r.raise_for_status()
        return r.text

    raise requests.HTTPError(f"403 persistente (o bloqueo) en {url} después de {retries} intentos")

def extract_lists_of_6(soup: BeautifulSoup) -> List[List[int]]:
    """
    En las páginas de lottoamerica, los números suelen venir en <li>.
    Esta función busca listas (<ul>/<ol>) donde haya EXACTAMENTE 6 <li> numéricos.
    """
    lists = []
    for ul in soup.find_all(["ul", "ol"]):
        nums = []
        for li in ul.find_all("li"):
            t = li.get_text(strip=True)
            if re.fullmatch(r"\d{1,2}", t):
                nums.append(int(t))
        if len(nums) == 6:
            lists.append(nums)
    return lists

def pick_drawn_order(lists6: List[List[int]]) -> List[int]:
    """
    Devuelve el orden de extracción:
      - identifica la lista ascendente (5 blancas ordenadas)
      - devuelve la otra lista
    Si solo hay una lista o son iguales, devuelve esa.
    """
    if not lists6:
        raise ValueError("No encontré listas de 6 números en el HTML (parser no detectó <ul>/<ol>).")

    # Si hay muchas, nos quedamos con únicas manteniendo orden
    uniq = []
    for x in lists6:
        if x not in uniq:
            uniq.append(x)
    lists6 = uniq

    if len(lists6) == 1:
        return lists6[0]

    def whites_sorted(x: List[int]) -> bool:
        return x[:5] == sorted(x[:5])

    asc = None
    for x in lists6:
        if whites_sorted(x):
            asc = x
            break
    if asc is None:
        asc = lists6[0]

    for x in lists6:
        if x != asc:
            return x

    return asc

def parse_draw(date_iso: str) -> Dict:
    url = f"{BASE}/powerball/numbers/{date_iso}"
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")

    lists6 = extract_lists_of_6(soup)

    # Fallback: si el HTML está “aplanado” y no detecta <ul>/<ol>,
    # extrae números por texto (esto es más bruto, pero salva casos raros).
    if not lists6:
        text = soup.get_text(" ", strip=True)
        nums = [int(x) for x in re.findall(r"\b(\d{1,2})\b", text)]
        # Busca ventanas de 6 que parezcan listas (muy conservador)
        candidates = []
        for i in range(0, len(nums) - 5):
            window = nums[i:i+6]
            # heurística: PB puede repetirse, pero blancos no suelen ser 0
            if all(1 <= n <= 59 for n in window):  # rangos antiguos variaban, esto solo evita basura obvia
                candidates.append(window)
        # dedup
        uniq = []
        for c in candidates:
            if c not in uniq:
                uniq.append(c)
        lists6 = uniq[:4]  # limita ruido

    drawn = pick_drawn_order(lists6)
    w1, w2, w3, w4, w5, pb = drawn

    return {
        "draw_date_iso": date_iso,
        "w1": w1, "w2": w2, "w3": w3, "w4": w4, "w5": w5, "pb": pb,
        "source": "lottoamerica.com",
        "order_type": "drawn_order"
    }

def main():
    # Lee tus fechas locales (sin usar /archive)
    df_dates = pd.read_csv(INPUT_DATES_CSV)
    if "draw_date_iso" not in df_dates.columns:
        raise ValueError(f"Tu archivo {INPUT_DATES_CSV} no tiene la columna draw_date_iso")

    df_dates["draw_date_iso"] = pd.to_datetime(df_dates["draw_date_iso"]).dt.strftime("%Y-%m-%d")
    dates = df_dates.loc[
        (df_dates["draw_date_iso"] >= START_DATE) &
        (df_dates["draw_date_iso"] <= END_DATE),
        "draw_date_iso"
    ].drop_duplicates().sort_values().tolist()

    print(f"Fechas a procesar: {len(dates)} ({START_DATE} -> {END_DATE})")

    # Warm-up: visita home una vez (a veces ayuda con cookies)
    try:
        session.get(BASE + "/", timeout=20)
    except Exception:
        pass

    rows = []
    failed = []

    for i, d in enumerate(dates, 1):
        try:
            rows.append(parse_draw(d))
        except Exception as e:
            print(f"FALLO {d}: {e}")
            failed.append(d)

        if i % 25 == 0:
            print(f"Progreso: {i}/{len(dates)}")
            # guardado parcial por si algo se corta
            pd.DataFrame(rows).to_csv(OUT_CSV, index=False)

        # throttle (más lento = menos bloqueos)
        time.sleep(random.uniform(0.8, 1.6))

    out = pd.DataFrame(rows).sort_values("draw_date_iso").reset_index(drop=True)
    out.to_csv(OUT_CSV, index=False)
    out.to_excel(OUT_XLSX, index=False)

    print(f"\nOK -> {OUT_CSV}")
    print(f"OK -> {OUT_XLSX}")

    if failed:
        print(f"\nFechas fallidas ({len(failed)}). Guardando failed_dates.txt")
        with open("failed_dates.txt", "w", encoding="utf-8") as f:
            for d in failed:
                f.write(d + "\n")

if __name__ == "__main__":
    main()
