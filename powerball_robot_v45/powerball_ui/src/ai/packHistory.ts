const KEY_PACKS = "powerball_pack_history_v1";
const KEY_FAVS = "powerball_favorites_v1";

export function savePack(result: any) {
  const packs = loadPacks();
  const item = {
    ts: Date.now(),
    meta: result?.meta || null,
    constraints: result?.constraints || null,
    results_by_assistant: result?.results_by_assistant || {},
  };
  packs.unshift(item);
  localStorage.setItem(KEY_PACKS, JSON.stringify(packs.slice(0, 50)));
}

export function loadPacks(): any[] {
  const raw = localStorage.getItem(KEY_PACKS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addFavorite(play: { whites: number[]; powerball: number; note?: string }) {
  const favs = loadFavorites();
  const key = `${play.whites.join("-")}|${play.powerball}`;
  if (!favs.find((f: any) => f.key === key)) favs.unshift({ key, ...play, ts: Date.now() });
  localStorage.setItem(KEY_FAVS, JSON.stringify(favs.slice(0, 200)));
}

export function removeFavorite(whites: number[], powerball: number) {
  const favs = loadFavorites().filter((f: any) => f.key !== `${whites.join("-")}|${powerball}`);
  localStorage.setItem(KEY_FAVS, JSON.stringify(favs));
}

export function loadFavorites(): any[] {
  const raw = localStorage.getItem(KEY_FAVS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
