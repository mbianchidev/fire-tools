/**
 * Tests for Questionnaire Logic utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  QUESTIONNAIRE_QUESTIONS, 
  calculateFIREPersona, 
  getPersonaInfo 
} from '../../src/utils/questionnaireLogic';
import { QuestionnaireResponse } from '../../src/types/questionnaire';

describe('QUESTIONNAIRE_QUESTIONS', () => {
  it('should have 14 questions', () => {
    expect(QUESTIONNAIRE_QUESTIONS.length).toBe(14);
  });

  it('should have unique question IDs', () => {
    const ids = QUESTIONNAIRE_QUESTIONS.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have at least 3 options per question', () => {
    QUESTIONNAIRE_QUESTIONS.forEach(question => {
      expect(question.options.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should have all required fields for each question', () => {
    QUESTIONNAIRE_QUESTIONS.forEach(question => {
      expect(question.id).toBeTruthy();
      expect(question.text).toBeTruthy();
      expect(question.category).toBeTruthy();
      expect(question.options).toBeTruthy();
    });
  });

  it('should have all required fields for each option', () => {
    QUESTIONNAIRE_QUESTIONS.forEach(question => {
      question.options.forEach(option => {
        expect(option.id).toBeTruthy();
        expect(option.label).toBeTruthy();
        expect(option.value).toBeTruthy();
        expect(option.icon).toBeTruthy();
      });
    });
  });
});

describe('calculateFIREPersona', () => {
  it('should return LEAN_FIRE for frugal/minimalist answers', () => {
    const responses: QuestionnaireResponse[] = [
      { questionId: 'q1_risk_tolerance', selectedOptionId: 'conservative' },
      { questionId: 'q2_current_age', selectedOptionId: 'age_20_30' },
      { questionId: 'q3_retirement_timeline', selectedOptionId: 'very_early' },
      { questionId: 'q4_lifestyle_expectations', selectedOptionId: 'frugal' },
      { questionId: 'q5_income_stability', selectedOptionId: 'stable' },
      { questionId: 'q6_income_growth', selectedOptionId: 'limited_growth' },
      { questionId: 'q7_work_preference', selectedOptionId: 'never_work' },
      { questionId: 'q8_family_plans', selectedOptionId: 'no_dependents' },
      { questionId: 'q9_housing', selectedOptionId: 'own_paid' },
      { questionId: 'q10_state_pension', selectedOptionId: 'unreliable' },
      { questionId: 'q11_emergency_fund', selectedOptionId: 'conservative_12m' },
      { questionId: 'q12_market_volatility', selectedOptionId: 'worry_hold' },
      { questionId: 'q13_health_concerns', selectedOptionId: 'excellent_low' },
      { questionId: 'q14_legacy', selectedOptionId: 'die_with_zero' },
    ];

    const result = calculateFIREPersona(responses);
    expect(result.persona).toBe('LEAN_FIRE');
    expect(result.safeWithdrawalRate).toBe(3.5); // 3.0 capped + 0.5 for die_with_zero
    expect(result.suggestedSavingsRate).toBe(60);
  });

  it('should return FAT_FIRE for luxurious lifestyle answers', () => {
    const responses: QuestionnaireResponse[] = [
      { questionId: 'q1_risk_tolerance', selectedOptionId: 'aggressive' },
      { questionId: 'q2_current_age', selectedOptionId: 'age_40_50' },
      { questionId: 'q3_retirement_timeline', selectedOptionId: 'standard' },
      { questionId: 'q4_lifestyle_expectations', selectedOptionId: 'luxurious' },
      { questionId: 'q5_income_stability', selectedOptionId: 'very_stable' },
      { questionId: 'q6_income_growth', selectedOptionId: 'high_growth' },
      { questionId: 'q7_work_preference', selectedOptionId: 'never_work' },
      { questionId: 'q8_family_plans', selectedOptionId: 'young_kids' },
      { questionId: 'q9_housing', selectedOptionId: 'want_to_buy' },
      { questionId: 'q10_state_pension', selectedOptionId: 'no_pension' },
      { questionId: 'q11_emergency_fund', selectedOptionId: 'standard_6m' },
      { questionId: 'q12_market_volatility', selectedOptionId: 'buy_more' },
      { questionId: 'q13_health_concerns', selectedOptionId: 'concerns_high' },
      { questionId: 'q14_legacy', selectedOptionId: 'large_legacy' },
    ];

    const result = calculateFIREPersona(responses);
    expect(result.persona).toBe('FAT_FIRE');
    expect(result.safeWithdrawalRate).toBe(2.75); // 3.0 base - 0.25 for large_legacy
    expect(result.suggestedSavingsRate).toBe(40);
  });

  it('should return BARISTA_FIRE for part-time work preference', () => {
    const responses: QuestionnaireResponse[] = [
      { questionId: 'q1_risk_tolerance', selectedOptionId: 'moderate' },
      { questionId: 'q2_current_age', selectedOptionId: 'age_30_40' },
      { questionId: 'q3_retirement_timeline', selectedOptionId: 'early' },
      { questionId: 'q4_lifestyle_expectations', selectedOptionId: 'comfortable' },
      { questionId: 'q5_income_stability', selectedOptionId: 'variable' },
      { questionId: 'q6_income_growth', selectedOptionId: 'limited_growth' },
      { questionId: 'q7_work_preference', selectedOptionId: 'part_time' },
      { questionId: 'q8_family_plans', selectedOptionId: 'no_dependents' },
      { questionId: 'q9_housing', selectedOptionId: 'rent_flexible' },
      { questionId: 'q10_state_pension', selectedOptionId: 'very_reliable' },
      { questionId: 'q11_emergency_fund', selectedOptionId: 'minimal_3m' },
      { questionId: 'q12_market_volatility', selectedOptionId: 'stay_calm' },
      { questionId: 'q13_health_concerns', selectedOptionId: 'good_average' },
      { questionId: 'q14_legacy', selectedOptionId: 'moderate_legacy' },
    ];

    const result = calculateFIREPersona(responses);
    expect(result.persona).toBe('BARISTA_FIRE');
    expect(result.safeWithdrawalRate).toBe(3.25); // Capped at 3.25% for early retirement, no legacy adjustment
    expect(result.suggestedSavingsRate).toBe(45);
  });

  it('should return COAST_FIRE for early savings focus', () => {
    const responses: QuestionnaireResponse[] = [
      { questionId: 'q1_risk_tolerance', selectedOptionId: 'aggressive' },
      { questionId: 'q2_current_age', selectedOptionId: 'age_20_30' },
      { questionId: 'q3_retirement_timeline', selectedOptionId: 'flexible' },
      { questionId: 'q4_lifestyle_expectations', selectedOptionId: 'frugal' },
      { questionId: 'q5_income_stability', selectedOptionId: 'unpredictable' },
      { questionId: 'q6_income_growth', selectedOptionId: 'high_growth' },
      { questionId: 'q7_work_preference', selectedOptionId: 'continue_working' },
      { questionId: 'q8_family_plans', selectedOptionId: 'no_dependents' },
      { questionId: 'q9_housing', selectedOptionId: 'rent_flexible' },
      { questionId: 'q10_state_pension', selectedOptionId: 'very_reliable' },
      { questionId: 'q11_emergency_fund', selectedOptionId: 'minimal_3m' },
      { questionId: 'q12_market_volatility', selectedOptionId: 'buy_more' },
      { questionId: 'q13_health_concerns', selectedOptionId: 'excellent_low' },
      { questionId: 'q14_legacy', selectedOptionId: 'minimal_legacy' },
    ];

    const result = calculateFIREPersona(responses);
    expect(result.persona).toBe('COAST_FIRE');
    expect(result.safeWithdrawalRate).toBe(3.75); // 3.5 base + 0.25 for minimal_legacy
    expect(result.suggestedSavingsRate).toBe(70);
  });

  it('should include asset allocation in results', () => {
    const responses: QuestionnaireResponse[] = [
      { questionId: 'q1_risk_tolerance', selectedOptionId: 'moderate' },
      { questionId: 'q2_current_age', selectedOptionId: 'age_30_40' },
      { questionId: 'q3_retirement_timeline', selectedOptionId: 'early' },
      { questionId: 'q4_lifestyle_expectations', selectedOptionId: 'comfortable' },
      { questionId: 'q5_income_stability', selectedOptionId: 'stable' },
      { questionId: 'q6_income_growth', selectedOptionId: 'moderate_growth' },
      { questionId: 'q7_work_preference', selectedOptionId: 'maybe_hobby' },
      { questionId: 'q8_family_plans', selectedOptionId: 'no_dependents' },
      { questionId: 'q9_housing', selectedOptionId: 'own_mortgage' },
      { questionId: 'q10_state_pension', selectedOptionId: 'somewhat_reliable' },
      { questionId: 'q11_emergency_fund', selectedOptionId: 'standard_6m' },
      { questionId: 'q12_market_volatility', selectedOptionId: 'stay_calm' },
      { questionId: 'q13_health_concerns', selectedOptionId: 'good_average' },
      { questionId: 'q14_legacy', selectedOptionId: 'moderate_legacy' },
    ];

    const result = calculateFIREPersona(responses);
    
    expect(result.assetAllocation).toBeDefined();
    expect(result.assetAllocation.stocks).toBeDefined();
    expect(result.assetAllocation.bonds).toBeDefined();
    expect(result.assetAllocation.cash).toBeDefined();
    
    // Allocation should add up to 100%
    const total = result.assetAllocation.stocks + 
                  result.assetAllocation.bonds + 
                  result.assetAllocation.cash +
                  (result.assetAllocation.realEstate || 0) +
                  (result.assetAllocation.crypto || 0);
    expect(total).toBe(100);
  });

  it('should include suitable assets in results', () => {
    const responses: QuestionnaireResponse[] = [
      { questionId: 'q1_risk_tolerance', selectedOptionId: 'moderate' },
      { questionId: 'q2_current_age', selectedOptionId: 'age_30_40' },
      { questionId: 'q3_retirement_timeline', selectedOptionId: 'early' },
      { questionId: 'q4_lifestyle_expectations', selectedOptionId: 'comfortable' },
      { questionId: 'q5_income_stability', selectedOptionId: 'stable' },
      { questionId: 'q6_income_growth', selectedOptionId: 'moderate_growth' },
      { questionId: 'q7_work_preference', selectedOptionId: 'maybe_hobby' },
      { questionId: 'q8_family_plans', selectedOptionId: 'no_dependents' },
      { questionId: 'q9_housing', selectedOptionId: 'own_mortgage' },
      { questionId: 'q10_state_pension', selectedOptionId: 'somewhat_reliable' },
      { questionId: 'q11_emergency_fund', selectedOptionId: 'standard_6m' },
      { questionId: 'q12_market_volatility', selectedOptionId: 'stay_calm' },
      { questionId: 'q13_health_concerns', selectedOptionId: 'good_average' },
      { questionId: 'q14_legacy', selectedOptionId: 'moderate_legacy' },
    ];

    const result = calculateFIREPersona(responses);
    
    expect(result.suitableAssets).toBeDefined();
    expect(result.suitableAssets.length).toBeGreaterThan(0);
  });

  it('should include completedAt timestamp', () => {
    const responses: QuestionnaireResponse[] = [
      { questionId: 'q1_risk_tolerance', selectedOptionId: 'moderate' },
      { questionId: 'q2_current_age', selectedOptionId: 'age_30_40' },
      { questionId: 'q3_retirement_timeline', selectedOptionId: 'early' },
      { questionId: 'q4_lifestyle_expectations', selectedOptionId: 'comfortable' },
      { questionId: 'q5_income_stability', selectedOptionId: 'stable' },
      { questionId: 'q6_income_growth', selectedOptionId: 'moderate_growth' },
      { questionId: 'q7_work_preference', selectedOptionId: 'maybe_hobby' },
      { questionId: 'q8_family_plans', selectedOptionId: 'no_dependents' },
      { questionId: 'q9_housing', selectedOptionId: 'own_mortgage' },
      { questionId: 'q10_state_pension', selectedOptionId: 'somewhat_reliable' },
      { questionId: 'q11_emergency_fund', selectedOptionId: 'standard_6m' },
      { questionId: 'q12_market_volatility', selectedOptionId: 'stay_calm' },
      { questionId: 'q13_health_concerns', selectedOptionId: 'good_average' },
      { questionId: 'q14_legacy', selectedOptionId: 'moderate_legacy' },
    ];

    const result = calculateFIREPersona(responses);
    
    expect(result.completedAt).toBeDefined();
    expect(new Date(result.completedAt).getTime()).not.toBeNaN();
  });

  it('should handle empty responses gracefully', () => {
    const responses: QuestionnaireResponse[] = [];
    const result = calculateFIREPersona(responses);
    
    expect(result.persona).toBeDefined();
    expect(result.assetAllocation).toBeDefined();
  });
});

describe('getPersonaInfo', () => {
  it('should return correct info for LEAN_FIRE', () => {
    const info = getPersonaInfo('LEAN_FIRE');
    expect(info.name).toBe('Lean FIRE');
    expect(info.icon).toBe('eco');
    expect(info.color).toBeTruthy();
    expect(info.tagline).toBeTruthy();
  });

  it('should return correct info for REGULAR_FIRE', () => {
    const info = getPersonaInfo('REGULAR_FIRE');
    expect(info.name).toBe('Regular FIRE');
    expect(info.icon).toBe('home');
    expect(info.color).toBeTruthy();
    expect(info.tagline).toBeTruthy();
  });

  it('should return correct info for FAT_FIRE', () => {
    const info = getPersonaInfo('FAT_FIRE');
    expect(info.name).toBe('Fat FIRE');
    expect(info.icon).toBe('diamond');
    expect(info.color).toBeTruthy();
    expect(info.tagline).toBeTruthy();
  });

  it('should return correct info for COAST_FIRE', () => {
    const info = getPersonaInfo('COAST_FIRE');
    expect(info.name).toBe('Coast FIRE');
    expect(info.icon).toBe('sailing');
    expect(info.color).toBeTruthy();
    expect(info.tagline).toBeTruthy();
  });

  it('should return correct info for BARISTA_FIRE', () => {
    const info = getPersonaInfo('BARISTA_FIRE');
    expect(info.name).toBe('Barista FIRE');
    expect(info.icon).toBe('coffee');
    expect(info.color).toBeTruthy();
    expect(info.tagline).toBeTruthy();
  });
});
