const KEY = "powerball_ai_profile_v1";

export function saveProfile(profile: any) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function loadProfile(): any | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearProfile() {
  localStorage.removeItem(KEY);
}
