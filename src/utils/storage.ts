const SESSION_HINT_KEY = 'campusconnect_session_hint';

export interface SessionHint {
  userId: string;
  email: string;
  role: string;
}

export const getSessionHint = (): SessionHint | null => {
  try {
    const item = localStorage.getItem(SESSION_HINT_KEY);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

export const setSessionHint = (hint: SessionHint): void => {
  try {
    localStorage.setItem(SESSION_HINT_KEY, JSON.stringify(hint));
  } catch {
    // Ignore storage quota / privacy errors
  }
};

export const clearSessionHint = (): void => {
  try {
    localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    // Ignore
  }
};
