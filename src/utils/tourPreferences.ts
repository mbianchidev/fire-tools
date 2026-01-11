/**
 * Tour preferences utilities
 * Handles saving/loading tour completion state to/from encrypted cookies
 */

import Cookies from 'js-cookie';
import { encryptData, decryptData } from './cookieEncryption';

const TOUR_COMPLETED_KEY = 'fire-tools-tour-completed';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 365,
  sameSite: 'strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

/**
 * Save tour completion state to encrypted cookies
 * @param completed - Whether the tour has been completed
 */
export function saveTourCompleted(completed: boolean): void {
  try {
    const payload = JSON.stringify({ completed });
    const encrypted = encryptData(payload);
    Cookies.set(TOUR_COMPLETED_KEY, encrypted, COOKIE_OPTIONS);
  } catch (error) {
    console.error('Failed to save tour preference:', error);
  }
}

/**
 * Load tour completion state from encrypted cookies
 * @returns Whether the tour has been completed (defaults to false)
 */
export function loadTourCompleted(): boolean {
  try {
    const encrypted = Cookies.get(TOUR_COMPLETED_KEY);
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

/**
 * Clear tour preference from cookies (allows restarting the tour)
 */
export function clearTourPreference(): void {
  try {
    Cookies.remove(TOUR_COMPLETED_KEY, { path: '/' });
  } catch (error) {
    console.error('Failed to clear tour preference:', error);
  }
}
