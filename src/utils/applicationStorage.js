const KEY = "loanApp.v1";

export function loadApplication() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveApplication(state) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // best-effort; storage may be unavailable (private mode, quota, etc.)
  }
}

export function clearApplication() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
