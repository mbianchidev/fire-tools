/**
 * Types for FIRE Questionnaire
 */

export type FIREPersona = 
  | 'LEAN_FIRE'       // Frugal living, minimal expenses
  | 'REGULAR_FIRE'    // Standard retirement, comfortable lifestyle
  | 'FAT_FIRE'        // Luxurious retirement, high expenses
  | 'COAST_FIRE'      // Save early, coast to retirement
  | 'BARISTA_FIRE';   // Part-time work in retirement

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  icon?: string; // Material icon name
}

export interface QuestionnaireQuestion {
  id: string;
  text: string;
  description?: string;
  category: 'risk' | 'lifestyle' | 'timeline' | 'income' | 'personal' | 'financial';
  options: QuestionOption[];
}

export interface QuestionnaireResponse {
  questionId: string;
  selectedOptionId: string;
}

export interface AssetAllocationTarget {
  stocks: number;
  bonds: number;
  cash: number;
  crypto?: number;
  realEstate?: number;
}

export interface QuestionnaireResults {
  persona: FIREPersona;
  personaExplanation: string;
  safeWithdrawalRate: number; // e.g., 3.5 for 3.5%
  suggestedSavingsRate: number; // e.g., 50 for 50%
  assetAllocation: AssetAllocationTarget;
  suitableAssets: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  responses: QuestionnaireResponse[];
  completedAt: string; // ISO timestamp
}

// Scoring weights for different aspects
export interface PersonaScores {
  leanFire: number;
  regularFire: number;
  fatFire: number;
  coastFire: number;
  baristaFire: number;
}
