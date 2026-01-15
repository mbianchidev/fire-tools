/**
 * Questionnaire Storage utilities
 * Handles saving/loading questionnaire results using encrypted cookies
 */

import Cookies from 'js-cookie';
import { QuestionnaireResults } from '../types/questionnaire';
import { encryptData, decryptData } from './cookieEncryption';

// Cookie key
const QUESTIONNAIRE_RESULTS_KEY = 'fire-tools-questionnaire-results';

// Cookie options - secure settings for production
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 365, // 1 year
  sameSite: 'strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

/**
 * Validate questionnaire results structure
 */
function isValidQuestionnaireResults(obj: any): obj is QuestionnaireResults {
  return (
    typeof obj === 'object' &&
    typeof obj.persona === 'string' &&
    typeof obj.personaExplanation === 'string' &&
    typeof obj.safeWithdrawalRate === 'number' &&
    typeof obj.suggestedSavingsRate === 'number' &&
    typeof obj.assetAllocation === 'object' &&
    Array.isArray(obj.suitableAssets) &&
    typeof obj.riskTolerance === 'string' &&
    Array.isArray(obj.responses) &&
    typeof obj.completedAt === 'string'
  );
}

/**
 * Save questionnaire results to encrypted cookies
 */
export function saveQuestionnaireResults(results: QuestionnaireResults): void {
  try {
    const resultsJson = JSON.stringify(results);
    const encryptedResults = encryptData(resultsJson);
    
    Cookies.set(QUESTIONNAIRE_RESULTS_KEY, encryptedResults, COOKIE_OPTIONS);
  } catch (error) {
    console.error('Failed to save questionnaire results to cookies:', error);
    throw new Error('Failed to save questionnaire results. Cookies may be disabled.');
  }
}

/**
 * Load questionnaire results from encrypted cookies
 */
export function loadQuestionnaireResults(): QuestionnaireResults | null {
  try {
    const encryptedResults = Cookies.get(QUESTIONNAIRE_RESULTS_KEY);
    if (!encryptedResults) {
      return null;
    }

    const decryptedResults = decryptData(encryptedResults);
    if (!decryptedResults) {
      return null;
    }

    const parsed = JSON.parse(decryptedResults);
    if (isValidQuestionnaireResults(parsed)) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error('Failed to load questionnaire results from cookies:', error);
    return null;
  }
}

/**
 * Clear questionnaire results from cookies
 */
export function clearQuestionnaireResults(): void {
  try {
    Cookies.remove(QUESTIONNAIRE_RESULTS_KEY, { path: '/' });
  } catch (error) {
    console.error('Failed to clear questionnaire results from cookies:', error);
  }
}

/**
 * Check if questionnaire has been completed
 */
export function hasCompletedQuestionnaire(): boolean {
  return loadQuestionnaireResults() !== null;
}
