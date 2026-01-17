import re
import time
from datetime import datetime
from typing import List, Dict

import requests
from bs4 import BeautifulSoup
import pandas as pd

# Usamos LottoAmerica porque Powerball.net suele bloquear scraping (403/recaptcha)
BASE = "https://www.lottoamerica.com"
YEARS = range(1992, 1998)  # 1992..1997 inclusive

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
})

def get(url: str) -> str:
    r = session.get(url, timeout=30)
    r.raise_for_status()
    return r.text

def year_archive_draw_urls(year: int) -> List[str]:
    """
    Lee https://www.lottoamerica.com/powerball/archive/YYYY y extrae links a
    /powerball/numbers/YYYY-MM-DD
    """
    html = get(f"{BASE}/powerball/archive/{year}")
    soup = BeautifulSoup(html, "html.parser")
    urls = set()

    for a in soup.select("a[href]"):
        href = a.get("href", "")
        if re.fullmatch(r"/powerball/numbers/\d{4}-\d{2}-\d{2}", href):
            urls.add(BASE + href)

    def k(u: str) -> datetime:
        ds = u.rsplit("/", 1)[-1]
        return datetime.strptime(ds, "%Y-%m-%d")

    return sorted(urls, key=k)

def extract_lists_of_6(soup: BeautifulSoup) -> List[List[int]]:
    """
    Extrae TODAS las listas (ul/ol) que contengan exactamente 6 números (li numéricos).
    NO elimina duplicados (a veces ascendente y drawn order son iguales).
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
    En LottoAmerica normalmente aparecen 2 listas:
      - 1ra: ascendente
      - 2da: draw order ("Show in draw order")
    Pero a veces pueden ser iguales o puede detectarse solo una.
    """
    if not lists6:
        raise ValueError("No encontré ninguna lista de 6 números en la página.")
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

    return asc  # si todas son iguales

def parse_draw(url: str) -> Dict:
    html = get(url)
    soup = BeautifulSoup(html, "html.parser")

    date_iso = url.rsplit("/", 1)[-1]
    lists6 = extract_lists_of_6(soup)
    drawn = pick_drawn_order(lists6)

    w1, w2, w3, w4, w5, pb = drawn
    return {
        "draw_date_iso": date_iso,
        "w1": w1, "w2": w2, "w3": w3, "w4": w4, "w5": w5, "pb": pb,
        "source": "lottoamerica.com",
        "order_type": "drawn_order"
    }

def main():
    rows = []
    for y in YEARS:
        urls = year_archive_draw_urls(y)
        print(f"{y}: {len(urls)} sorteos")
        for i, u in enumerate(urls, 1):
            try:
                rows.append(parse_draw(u))
            except Exception as e:
                print(f"ERROR en {u}: {e}")
                continue

            if i % 50 == 0:
                print(f"  {y}: {i}/{len(urls)}")
            time.sleep(0.12)  # throttle suave

    df = pd.DataFrame(rows).sort_values("draw_date_iso").reset_index(drop=True)
    df.to_csv("powerball_drawn_order_1992_1997.csv", index=False)
    df.to_excel("powerball_drawn_order_1992_1997.xlsx", index=False)
    print("OK -> powerball_drawn_order_1992_1997.csv / .xlsx")

if __name__ == "__main__":
    main()
