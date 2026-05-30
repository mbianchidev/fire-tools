/**
 * Tour preferences utilities
 * Handles saving/loading tour completion state to/from encrypted cookies
 */

import SafeCookies from './safeCookies';
import type { CookieAttributes } from './safeCookies';
import { encryptData, decryptData } from './cookieEncryption';
import {
  PREF_KEY_TOUR_COMPLETED,
  pushPreferenceToBackend,
  deletePreferenceFromBackend,
} from './uiPreferencesSync';

const TOUR_COMPLETED_KEY = 'fire-tools-tour-completed';

const COOKIE_OPTIONS: CookieAttributes = {
  expires: 365,
  sameSite: 'strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

export function saveTourCompleted(completed: boolean): void {
  try {
    const payload = JSON.stringify({ completed });
    const encrypted = encryptData(payload);
    SafeCookies.set(TOUR_COMPLETED_KEY, encrypted, COOKIE_OPTIONS);
    pushPreferenceToBackend(PREF_KEY_TOUR_COMPLETED, payload);
  } catch (error) {
    console.error('Failed to save tour preference:', error);
  }
}

export function loadTourCompleted(): boolean {
  try {
    const encrypted = SafeCookies.get(TOUR_COMPLETED_KEY);
    if (!encrypted) {
      return false;
    }

    const decrypted = decryptData(encrypted);
    if (!decrypted) {
      return false;
    }

    const parsed = JSON.parse(decrypted);
    return parsed.completed === true;
  } catch (error) {
    console.error('Failed to load tour preference:', error);
    return false;
  }
}

export function clearTourPreference(): void {
  try {
    SafeCookies.remove(TOUR_COMPLETED_KEY, { path: '/' });
    deletePreferenceFromBackend(PREF_KEY_TOUR_COMPLETED);
  } catch (error) {
    console.error('Failed to clear tour preference:', error);
  }
}
