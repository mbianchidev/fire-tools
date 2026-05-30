/**
 * Questionnaire Prompt Preferences
 * Handles saving/loading the questionnaire prompt dismissed state to/from encrypted cookies
 */

import Cookies from 'js-cookie';
import { encryptData, decryptData } from './cookieEncryption';
import {
  PREF_KEY_QUESTIONNAIRE_PROMPT_DISMISSED,
  pushPreferenceToBackend,
  deletePreferenceFromBackend,
} from './uiPreferencesSync';

const QUESTIONNAIRE_PROMPT_DISMISSED_KEY = 'fire-tools-questionnaire-prompt-dismissed';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 365,
  sameSite: 'strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

export function saveQuestionnairePromptDismissed(dismissed: boolean): void {
  try {
    const payload = JSON.stringify({ dismissed });
    const encrypted = encryptData(payload);
    Cookies.set(QUESTIONNAIRE_PROMPT_DISMISSED_KEY, encrypted, COOKIE_OPTIONS);
    pushPreferenceToBackend(PREF_KEY_QUESTIONNAIRE_PROMPT_DISMISSED, payload);
  } catch (error) {
    console.error('Failed to save questionnaire prompt preference:', error);
  }
}

export function loadQuestionnairePromptDismissed(): boolean {
  try {
    const encrypted = Cookies.get(QUESTIONNAIRE_PROMPT_DISMISSED_KEY);
    if (!encrypted) {
      return false;
    }

    const decrypted = decryptData(encrypted);
    if (!decrypted) {
      return false;
    }

    const parsed = JSON.parse(decrypted);
    return parsed.dismissed === true;
  } catch (error) {
    console.error('Failed to load questionnaire prompt preference:', error);
    return false;
  }
}

export function clearQuestionnairePromptPreference(): void {
  try {
    Cookies.remove(QUESTIONNAIRE_PROMPT_DISMISSED_KEY, { path: '/' });
    deletePreferenceFromBackend(PREF_KEY_QUESTIONNAIRE_PROMPT_DISMISSED);
  } catch (error) {
    console.error('Failed to clear questionnaire prompt preference:', error);
  }
}
