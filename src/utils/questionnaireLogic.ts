/**
 * FIRE Questionnaire Logic
 * Questions, scoring, and recommendations
 */

import { 
  QuestionnaireQuestion, 
  QuestionnaireResponse, 
  QuestionnaireResults, 
  FIREPersona,
  PersonaScores,
  AssetAllocationTarget 
} from '../types/questionnaire';

// Valid risk tolerance values
const VALID_RISK_TOLERANCES = ['conservative', 'moderate', 'aggressive'] as const;
type RiskTolerance = typeof VALID_RISK_TOLERANCES[number];

/**
 * Type guard to check if a value is a valid risk tolerance
 */
function isValidRiskTolerance(value: string | undefined): value is RiskTolerance {
  return value !== undefined && VALID_RISK_TOLERANCES.includes(value as RiskTolerance);
}

// Questionnaire Questions
export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'q1_risk_tolerance',
    text: 'How would you describe your investment risk tolerance?',
    description: 'Your comfort level with market volatility',
    category: 'risk',
    options: [
      { id: 'conservative', label: 'Conservative', value: 'conservative', icon: 'shield' },
      { id: 'moderate', label: 'Moderate', value: 'moderate', icon: 'balance' },
      { id: 'aggressive', label: 'Aggressive', value: 'aggressive', icon: 'trending_up' },
    ],
  },
  {
    id: 'q2_current_age',
    text: 'What is your current age range?',
    description: 'Your age affects optimal asset allocation and time horizon',
    category: 'personal',
    options: [
      { id: 'age_20_30', label: '20-30 years old', value: 'age_20_30', icon: 'school' },
      { id: 'age_30_40', label: '30-40 years old', value: 'age_30_40', icon: 'work' },
      { id: 'age_40_50', label: '40-50 years old', value: 'age_40_50', icon: 'business_center' },
      { id: 'age_50_plus', label: '50+ years old', value: 'age_50_plus', icon: 'elderly' },
    ],
  },
  {
    id: 'q3_retirement_timeline',
    text: 'When do you plan to achieve FIRE?',
    description: 'Your target retirement age or timeframe',
    category: 'timeline',
    options: [
      { id: 'very_early', label: 'Very Early (Before 40)', value: 'very_early', icon: 'rocket_launch' },
      { id: 'early', label: 'Early (40-50)', value: 'early', icon: 'flight_takeoff' },
      { id: 'standard', label: 'Standard (50-60)', value: 'standard', icon: 'schedule' },
      { id: 'flexible', label: 'Flexible/No Rush', value: 'flexible', icon: 'all_inclusive' },
    ],
  },
  {
    id: 'q4_lifestyle_expectations',
    text: 'What lifestyle do you envision in retirement?',
    description: 'Your expected spending and quality of life',
    category: 'lifestyle',
    options: [
      { id: 'frugal', label: 'Frugal & Minimalist', value: 'frugal', icon: 'eco' },
      { id: 'comfortable', label: 'Comfortable & Modest', value: 'comfortable', icon: 'home' },
      { id: 'abundant', label: 'Abundant & Flexible', value: 'abundant', icon: 'restaurant' },
      { id: 'luxurious', label: 'Luxurious & Indulgent', value: 'luxurious', icon: 'diamond' },
    ],
  },
  {
    id: 'q5_income_stability',
    text: 'How stable and predictable is your current income?',
    description: 'Job security and income consistency',
    category: 'income',
    options: [
      { id: 'very_stable', label: 'Very Stable (Public Sector)', value: 'very_stable', icon: 'verified' },
      { id: 'stable', label: 'Stable (Corporate)', value: 'stable', icon: 'business_center' },
      { id: 'variable', label: 'Variable (Entrepreneurial)', value: 'variable', icon: 'store' },
      { id: 'unpredictable', label: 'Unpredictable (Freelance)', value: 'unpredictable', icon: 'design_services' },
    ],
  },
  {
    id: 'q6_income_growth',
    text: 'What are your income growth prospects?',
    description: 'Expected salary increases over time',
    category: 'income',
    options: [
      { id: 'high_growth', label: 'High Growth Potential', value: 'high_growth', icon: 'insights' },
      { id: 'moderate_growth', label: 'Moderate Growth', value: 'moderate_growth', icon: 'show_chart' },
      { id: 'limited_growth', label: 'Limited Growth', value: 'limited_growth', icon: 'horizontal_rule' },
      { id: 'peak_earnings', label: 'Already at Peak', value: 'peak_earnings', icon: 'landscape' },
    ],
  },
  {
    id: 'q7_work_preference',
    text: 'How do you feel about working in retirement?',
    description: 'Willingness to work part-time after FIRE',
    category: 'personal',
    options: [
      { id: 'never_work', label: 'Never Want to Work', value: 'never_work', icon: 'beach_access' },
      { id: 'maybe_hobby', label: 'Maybe Hobby/Passion Projects', value: 'maybe_hobby', icon: 'palette' },
      { id: 'part_time', label: 'Open to Part-Time', value: 'part_time', icon: 'work_history' },
      { id: 'continue_working', label: 'Plan to Keep Working', value: 'continue_working', icon: 'badge' },
    ],
  },
  {
    id: 'q8_family_plans',
    text: 'Do you have or plan to have dependents?',
    description: 'Children or family financial responsibilities',
    category: 'personal',
    options: [
      { id: 'no_dependents', label: 'No Dependents', value: 'no_dependents', icon: 'person' },
      { id: 'future_kids', label: 'Planning for Children', value: 'future_kids', icon: 'pregnant_woman' },
      { id: 'young_kids', label: 'Young Children', value: 'young_kids', icon: 'child_care' },
      { id: 'older_dependents', label: 'Older Dependents/Parents', value: 'older_dependents', icon: 'elderly' },
    ],
  },
  {
    id: 'q9_housing',
    text: 'What is your housing situation and preference?',
    description: 'Current and future housing plans',
    category: 'lifestyle',
    options: [
      { id: 'own_paid', label: 'Own (Mortgage-Free)', value: 'own_paid', icon: 'house' },
      { id: 'own_mortgage', label: 'Own (With Mortgage)', value: 'own_mortgage', icon: 'real_estate_agent' },
      { id: 'rent_flexible', label: 'Rent (Happy to Continue)', value: 'rent_flexible', icon: 'apartment' },
      { id: 'want_to_buy', label: 'Rent (Want to Buy)', value: 'want_to_buy', icon: 'home_work' },
    ],
  },
  {
    id: 'q10_state_pension',
    text: 'How reliable do you consider your state/government pension?',
    description: 'Trust in public pension systems',
    category: 'financial',
    options: [
      { id: 'very_reliable', label: 'Very Reliable', value: 'very_reliable', icon: 'account_balance' },
      { id: 'somewhat_reliable', label: 'Somewhat Reliable', value: 'somewhat_reliable', icon: 'gavel' },
      { id: 'unreliable', label: 'Unreliable', value: 'unreliable', icon: 'warning' },
      { id: 'no_pension', label: 'No State Pension', value: 'no_pension', icon: 'money_off' },
    ],
  },
  {
    id: 'q11_emergency_fund',
    text: 'How large should your emergency fund be?',
    description: 'Months of expenses in cash reserves',
    category: 'financial',
    options: [
      { id: 'minimal_3m', label: 'Minimal (3 months)', value: 'minimal_3m', icon: 'speed' },
      { id: 'standard_6m', label: 'Standard (6 months)', value: 'standard_6m', icon: 'savings' },
      { id: 'conservative_12m', label: 'Conservative (12 months)', value: 'conservative_12m', icon: 'security' },
      { id: 'very_large_24m', label: 'Very Large (24+ months)', value: 'very_large_24m', icon: 'lock' },
    ],
  },
  {
    id: 'q12_market_volatility',
    text: 'How would you react to a 30% market drop?',
    description: 'Your emotional response to losses',
    category: 'risk',
    options: [
      { id: 'panic_sell', label: 'Panic and Sell', value: 'panic_sell', icon: 'crisis_alert' },
      { id: 'worry_hold', label: 'Worry but Hold', value: 'worry_hold', icon: 'sentiment_worried' },
      { id: 'stay_calm', label: 'Stay Calm', value: 'stay_calm', icon: 'self_improvement' },
      { id: 'buy_more', label: 'Buy More (Opportunity!)', value: 'buy_more', icon: 'shopping_cart' },
    ],
  },
  {
    id: 'q13_health_concerns',
    text: 'How do you rate your health and healthcare costs?',
    description: 'Expected medical expenses in retirement',
    category: 'personal',
    options: [
      { id: 'excellent_low', label: 'Excellent Health, Low Costs', value: 'excellent_low', icon: 'fitness_center' },
      { id: 'good_average', label: 'Good Health, Average Costs', value: 'good_average', icon: 'favorite' },
      { id: 'fair_higher', label: 'Fair Health, Higher Costs', value: 'fair_higher', icon: 'healing' },
      { id: 'concerns_high', label: 'Health Concerns, High Costs', value: 'concerns_high', icon: 'local_hospital' },
    ],
  },
  {
    id: 'q14_legacy',
    text: 'What is your philosophy on wealth at end of life?',
    description: 'Whether to spend it all or leave an inheritance',
    category: 'financial',
    options: [
      { id: 'die_with_zero', label: 'Die with Zero', value: 'die_with_zero', icon: 'celebration' },
      { id: 'minimal_legacy', label: 'Minimal Legacy (Cover Funeral)', value: 'minimal_legacy', icon: 'balance' },
      { id: 'moderate_legacy', label: 'Leave Some Inheritance', value: 'moderate_legacy', icon: 'family_restroom' },
      { id: 'large_legacy', label: 'Preserve Wealth for Heirs', value: 'large_legacy', icon: 'account_balance' },
    ],
  },
];

/**
 * Calculate FIRE persona based on questionnaire responses
 */
export function calculateFIREPersona(responses: QuestionnaireResponse[]): QuestionnaireResults {
  const scores: PersonaScores = {
    leanFire: 0,
    regularFire: 0,
    fatFire: 0,
    coastFire: 0,
    baristaFire: 0,
  };

  // Helper to get response value
  const getResponse = (questionId: string): string | undefined => {
    const response = responses.find(r => r.questionId === questionId);
    if (!response) return undefined;
    
    const question = QUESTIONNAIRE_QUESTIONS.find(q => q.id === questionId);
    const option = question?.options.find(o => o.id === response.selectedOptionId);
    return option?.value;
  };

  // Analyze responses and calculate scores
  // Every FIRE type gets a score (positive or negative) for every question
  
  // Q1: Risk Tolerance
  const riskTolerance = getResponse('q1_risk_tolerance');
  if (riskTolerance === 'conservative') {
    scores.leanFire += 3;
    scores.regularFire += 3;
    scores.fatFire -= 2;
    scores.coastFire += 1;
    scores.baristaFire += 2;
  } else if (riskTolerance === 'moderate') {
    scores.leanFire += 1;
    scores.regularFire += 3;
    scores.fatFire += 2;
    scores.coastFire += 1;
    scores.baristaFire += 2;
  } else if (riskTolerance === 'aggressive') {
    scores.leanFire -= 1;
    scores.regularFire += 1;
    scores.fatFire += 4;
    scores.coastFire += 3;
    scores.baristaFire -= 1;
  }

  // Q2: Current Age (affects time horizon and asset allocation)
  const currentAge = getResponse('q2_current_age');
  if (currentAge === 'age_20_30') {
    scores.leanFire += 3;
    scores.regularFire += 1;
    scores.fatFire += 2;
    scores.coastFire += 4;
    scores.baristaFire += 1;
  } else if (currentAge === 'age_30_40') {
    scores.leanFire += 2;
    scores.regularFire += 3;
    scores.fatFire += 2;
    scores.coastFire += 2;
    scores.baristaFire += 2;
  } else if (currentAge === 'age_40_50') {
    scores.leanFire += 1;
    scores.regularFire += 3;
    scores.fatFire += 3;
    scores.coastFire -= 1;
    scores.baristaFire += 3;
  } else if (currentAge === 'age_50_plus') {
    scores.leanFire -= 1;
    scores.regularFire += 2;
    scores.fatFire += 3;
    scores.coastFire -= 3;
    scores.baristaFire += 4;
  }

  // Q3: Retirement Timeline
  const timeline = getResponse('q3_retirement_timeline');
  if (timeline === 'very_early') {
    scores.leanFire += 4;
    scores.regularFire -= 1;
    scores.fatFire -= 2;
    scores.coastFire += 3;
    scores.baristaFire += 1;
  } else if (timeline === 'early') {
    scores.leanFire += 2;
    scores.regularFire += 3;
    scores.fatFire += 1;
    scores.coastFire += 1;
    scores.baristaFire += 2;
  } else if (timeline === 'standard') {
    scores.leanFire -= 1;
    scores.regularFire += 3;
    scores.fatFire += 3;
    scores.coastFire -= 1;
    scores.baristaFire += 1;
  } else if (timeline === 'flexible') {
    scores.leanFire -= 2;
    scores.regularFire += 1;
    scores.fatFire += 1;
    scores.coastFire += 4;
    scores.baristaFire += 3;
  }

  // Q4: Lifestyle Expectations
  const lifestyle = getResponse('q4_lifestyle_expectations');
  if (lifestyle === 'frugal') {
    scores.leanFire += 5;
    scores.regularFire -= 1;
    scores.fatFire -= 4;
    scores.coastFire += 3;
    scores.baristaFire += 1;
  } else if (lifestyle === 'comfortable') {
    scores.leanFire += 1;
    scores.regularFire += 4;
    scores.fatFire -= 1;
    scores.coastFire += 1;
    scores.baristaFire += 2;
  } else if (lifestyle === 'abundant') {
    scores.leanFire -= 3;
    scores.regularFire += 2;
    scores.fatFire += 4;
    scores.coastFire -= 1;
    scores.baristaFire += 1;
  } else if (lifestyle === 'luxurious') {
    scores.leanFire -= 5;
    scores.regularFire -= 1;
    scores.fatFire += 5;
    scores.coastFire -= 3;
    scores.baristaFire -= 2;
  }

  // Q5: Income Stability
  const incomeStability = getResponse('q5_income_stability');
  if (incomeStability === 'very_stable') {
    scores.leanFire += 2;
    scores.regularFire += 3;
    scores.fatFire += 2;
    scores.coastFire += 1;
    scores.baristaFire -= 1;
  } else if (incomeStability === 'stable') {
    scores.leanFire += 1;
    scores.regularFire += 2;
    scores.fatFire += 1;
    scores.coastFire += 1;
    scores.baristaFire += 1;
  } else if (incomeStability === 'variable') {
    scores.leanFire -= 1;
    scores.regularFire -= 1;
    scores.fatFire += 1;
    scores.coastFire += 2;
    scores.baristaFire += 2;
  } else if (incomeStability === 'unpredictable') {
    scores.leanFire -= 2;
    scores.regularFire -= 2;
    scores.fatFire -= 1;
    scores.coastFire += 1;
    scores.baristaFire += 3;
  }

  // Q6: Income Growth
  const incomeGrowth = getResponse('q6_income_growth');
  if (incomeGrowth === 'high_growth') {
    scores.leanFire -= 1;
    scores.regularFire += 1;
    scores.fatFire += 4;
    scores.coastFire += 3;
    scores.baristaFire -= 1;
  } else if (incomeGrowth === 'moderate_growth') {
    scores.leanFire += 1;
    scores.regularFire += 3;
    scores.fatFire += 1;
    scores.coastFire += 1;
    scores.baristaFire += 1;
  } else if (incomeGrowth === 'limited_growth') {
    scores.leanFire += 2;
    scores.regularFire += 1;
    scores.fatFire -= 2;
    scores.coastFire -= 1;
    scores.baristaFire += 2;
  } else if (incomeGrowth === 'peak_earnings') {
    scores.leanFire += 2;
    scores.regularFire += 2;
    scores.fatFire += 1;
    scores.coastFire -= 2;
    scores.baristaFire += 2;
  }

  // Q7: Work Preference
  const workPreference = getResponse('q7_work_preference');
  if (workPreference === 'never_work') {
    scores.leanFire += 3;
    scores.regularFire += 3;
    scores.fatFire += 3;
    scores.coastFire -= 3;
    scores.baristaFire -= 3;
  } else if (workPreference === 'maybe_hobby') {
    scores.leanFire += 1;
    scores.regularFire += 2;
    scores.fatFire += 2;
    scores.coastFire += 1;
    scores.baristaFire += 1;
  } else if (workPreference === 'part_time') {
    scores.leanFire -= 1;
    scores.regularFire -= 1;
    scores.fatFire -= 2;
    scores.coastFire += 2;
    scores.baristaFire += 4;
  } else if (workPreference === 'continue_working') {
    scores.leanFire -= 3;
    scores.regularFire -= 2;
    scores.fatFire -= 2;
    scores.coastFire += 4;
    scores.baristaFire += 3;
  }

  // Q8: Family Plans
  const familyPlans = getResponse('q8_family_plans');
  if (familyPlans === 'no_dependents') {
    scores.leanFire += 4;
    scores.regularFire += 1;
    scores.fatFire -= 1;
    scores.coastFire += 3;
    scores.baristaFire += 1;
  } else if (familyPlans === 'future_kids') {
    scores.leanFire -= 2;
    scores.regularFire += 2;
    scores.fatFire += 2;
    scores.coastFire -= 1;
    scores.baristaFire += 1;
  } else if (familyPlans === 'young_kids') {
    scores.leanFire -= 3;
    scores.regularFire += 2;
    scores.fatFire += 3;
    scores.coastFire -= 2;
    scores.baristaFire += 2;
  } else if (familyPlans === 'older_dependents') {
    scores.leanFire -= 2;
    scores.regularFire += 1;
    scores.fatFire += 3;
    scores.coastFire -= 1;
    scores.baristaFire += 2;
  }

  // Q9: Housing
  const housing = getResponse('q9_housing');
  if (housing === 'own_paid') {
    scores.leanFire += 3;
    scores.regularFire += 3;
    scores.fatFire += 1;
    scores.coastFire += 2;
    scores.baristaFire += 2;
  } else if (housing === 'own_mortgage') {
    scores.leanFire -= 1;
    scores.regularFire += 2;
    scores.fatFire += 2;
    scores.coastFire -= 1;
    scores.baristaFire += 1;
  } else if (housing === 'rent_flexible') {
    scores.leanFire += 2;
    scores.regularFire -= 1;
    scores.fatFire -= 2;
    scores.coastFire += 2;
    scores.baristaFire += 1;
  } else if (housing === 'want_to_buy') {
    scores.leanFire -= 2;
    scores.regularFire += 1;
    scores.fatFire += 3;
    scores.coastFire -= 2;
    scores.baristaFire += 1;
  }

  // Q10: State Pension
  const statePension = getResponse('q10_state_pension');
  if (statePension === 'very_reliable') {
    scores.leanFire += 1;
    scores.regularFire += 1;
    scores.fatFire -= 1;
    scores.coastFire += 4;
    scores.baristaFire += 3;
  } else if (statePension === 'somewhat_reliable') {
    scores.leanFire += 1;
    scores.regularFire += 2;
    scores.fatFire += 1;
    scores.coastFire += 2;
    scores.baristaFire += 2;
  } else if (statePension === 'unreliable') {
    scores.leanFire += 2;
    scores.regularFire += 2;
    scores.fatFire += 2;
    scores.coastFire -= 1;
    scores.baristaFire -= 1;
  } else if (statePension === 'no_pension') {
    scores.leanFire += 2;
    scores.regularFire += 1;
    scores.fatFire += 3;
    scores.coastFire -= 3;
    scores.baristaFire -= 2;
  }

  // Q11: Emergency Fund
  const emergencyFund = getResponse('q11_emergency_fund');
  if (emergencyFund === 'minimal_3m') {
    scores.leanFire -= 1;
    scores.regularFire -= 1;
    scores.fatFire -= 2;
    scores.coastFire += 2;
    scores.baristaFire += 2;
  } else if (emergencyFund === 'standard_6m') {
    scores.leanFire += 1;
    scores.regularFire += 3;
    scores.fatFire += 1;
    scores.coastFire += 1;
    scores.baristaFire += 1;
  } else if (emergencyFund === 'conservative_12m') {
    scores.leanFire += 3;
    scores.regularFire += 2;
    scores.fatFire += 2;
    scores.coastFire -= 1;
    scores.baristaFire += 1;
  } else if (emergencyFund === 'very_large_24m') {
    scores.leanFire += 2;
    scores.regularFire += 1;
    scores.fatFire += 3;
    scores.coastFire -= 2;
    scores.baristaFire -= 1;
  }

  // Q12: Market Volatility
  const marketVolatility = getResponse('q12_market_volatility');
  if (marketVolatility === 'panic_sell') {
    scores.leanFire += 2;
    scores.regularFire += 1;
    scores.fatFire -= 3;
    scores.coastFire -= 2;
    scores.baristaFire += 2;
  } else if (marketVolatility === 'worry_hold') {
    scores.leanFire += 2;
    scores.regularFire += 2;
    scores.fatFire -= 1;
    scores.coastFire += 1;
    scores.baristaFire += 2;
  } else if (marketVolatility === 'stay_calm') {
    scores.leanFire += 1;
    scores.regularFire += 3;
    scores.fatFire += 2;
    scores.coastFire += 2;
    scores.baristaFire += 1;
  } else if (marketVolatility === 'buy_more') {
    scores.leanFire -= 1;
    scores.regularFire += 1;
    scores.fatFire += 4;
    scores.coastFire += 3;
    scores.baristaFire -= 1;
  }

  // Q13: Health Concerns
  const healthConcerns = getResponse('q13_health_concerns');
  if (healthConcerns === 'excellent_low') {
    scores.leanFire += 3;
    scores.regularFire += 2;
    scores.fatFire -= 1;
    scores.coastFire += 2;
    scores.baristaFire += 1;
  } else if (healthConcerns === 'good_average') {
    scores.leanFire += 1;
    scores.regularFire += 2;
    scores.fatFire += 1;
    scores.coastFire += 1;
    scores.baristaFire += 1;
  } else if (healthConcerns === 'fair_higher') {
    scores.leanFire -= 2;
    scores.regularFire += 1;
    scores.fatFire += 3;
    scores.coastFire -= 1;
    scores.baristaFire += 2;
  } else if (healthConcerns === 'concerns_high') {
    scores.leanFire -= 3;
    scores.regularFire -= 1;
    scores.fatFire += 4;
    scores.coastFire -= 2;
    scores.baristaFire += 3;
  }

  // Q14: Legacy Preference (die with zero vs leave inheritance)
  const legacyPreference = getResponse('q14_legacy');
  if (legacyPreference === 'die_with_zero') {
    scores.leanFire += 4;
    scores.regularFire += 2;
    scores.fatFire -= 2;
    scores.coastFire += 3;
    scores.baristaFire += 2;
  } else if (legacyPreference === 'minimal_legacy') {
    scores.leanFire += 2;
    scores.regularFire += 3;
    scores.fatFire += 1;
    scores.coastFire += 2;
    scores.baristaFire += 2;
  } else if (legacyPreference === 'moderate_legacy') {
    scores.leanFire -= 1;
    scores.regularFire += 2;
    scores.fatFire += 3;
    scores.coastFire -= 1;
    scores.baristaFire += 1;
  } else if (legacyPreference === 'large_legacy') {
    scores.leanFire -= 3;
    scores.regularFire -= 1;
    scores.fatFire += 4;
    scores.coastFire -= 3;
    scores.baristaFire -= 2;
  }

  // Determine winning persona
  const personaArray: [FIREPersona, number][] = [
    ['LEAN_FIRE', scores.leanFire],
    ['REGULAR_FIRE', scores.regularFire],
    ['FAT_FIRE', scores.fatFire],
    ['COAST_FIRE', scores.coastFire],
    ['BARISTA_FIRE', scores.baristaFire],
  ];

  personaArray.sort((a, b) => b[1] - a[1]);
  const winningPersona = personaArray[0][0];

  // Generate recommendations based on persona
  const riskToleranceValue: RiskTolerance = isValidRiskTolerance(riskTolerance) 
    ? riskTolerance 
    : 'moderate';
  
  const recommendations = generateRecommendations(winningPersona, riskToleranceValue, currentAge, timeline, legacyPreference);

  return {
    persona: winningPersona,
    personaExplanation: recommendations.explanation,
    safeWithdrawalRate: recommendations.safeWithdrawalRate,
    suggestedSavingsRate: recommendations.suggestedSavingsRate,
    assetAllocation: recommendations.assetAllocation,
    suitableAssets: recommendations.suitableAssets,
    riskTolerance: riskToleranceValue,
    responses,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Generate detailed recommendations based on persona, risk tolerance, age, timeline, and legacy preference
 * The 4% rule is a fallacy for early retirement - we use max 3% for very early FIRE
 */
function generateRecommendations(
  persona: FIREPersona, 
  riskTolerance: RiskTolerance,
  currentAge: string | undefined,
  retirementTimeline: string | undefined,
  legacyPreference: string | undefined
): {
  explanation: string;
  safeWithdrawalRate: number;
  suggestedSavingsRate: number;
  assetAllocation: AssetAllocationTarget;
  suitableAssets: string[];
} {
  const recommendations = {
    LEAN_FIRE: {
      explanation: 'You align with Lean FIRE, focusing on minimalist living and frugal retirement. This path requires the smallest nest egg but demands disciplined spending. You prioritize freedom and simplicity over luxury.',
      baseSWR: 3.0,
      suggestedSavingsRate: 60,
      assetAllocation: {
        conservative: { stocks: 50, bonds: 40, cash: 10 },
        moderate: { stocks: 60, bonds: 30, cash: 10 },
        aggressive: { stocks: 70, bonds: 20, cash: 10 },
      },
      suitableAssets: [
        'Low-cost broad market index funds',
        'Total market exchange-traded funds',
        'Government bonds',
        'High-yield savings accounts',
        'Inflation-protected securities',
      ],
    },
    REGULAR_FIRE: {
      explanation: 'You align with Regular FIRE, seeking a comfortable traditional retirement lifestyle. This balanced approach allows for a modest but stable retirement without extreme frugality or luxury.',
      baseSWR: 3.5,
      suggestedSavingsRate: 50,
      assetAllocation: {
        conservative: { stocks: 60, bonds: 30, cash: 10 },
        moderate: { stocks: 70, bonds: 20, cash: 10 },
        aggressive: { stocks: 80, bonds: 15, cash: 5 },
      },
      suitableAssets: [
        'Diversified index funds',
        'Total stock market ETFs',
        'Aggregate bond funds',
        'International equity ETFs',
        'Target-date retirement funds',
      ],
    },
    FAT_FIRE: {
      explanation: 'You align with Fat FIRE, pursuing an abundant lifestyle with significant financial cushion. This requires the largest nest egg but provides maximum flexibility and luxury in retirement.',
      baseSWR: 3.0,
      suggestedSavingsRate: 40,
      assetAllocation: {
        conservative: { stocks: 60, bonds: 25, cash: 10, realEstate: 5 },
        moderate: { stocks: 70, bonds: 15, cash: 10, realEstate: 5 },
        aggressive: { stocks: 75, bonds: 10, cash: 5, realEstate: 5, crypto: 5 },
      },
      suitableAssets: [
        'Growth-oriented index funds',
        'International equity funds',
        'Alternative investments',
        'Real estate properties',
        'Large-cap equities',
        'Municipal bonds',
      ],
    },
    COAST_FIRE: {
      explanation: 'You align with Coast FIRE, where you save aggressively early then let compound interest work its magic. You can switch to a lower-stress job or reduce work hours while your investments grow to FIRE.',
      baseSWR: 3.5,
      suggestedSavingsRate: 70,
      assetAllocation: {
        conservative: { stocks: 70, bonds: 20, cash: 10 },
        moderate: { stocks: 80, bonds: 15, cash: 5 },
        aggressive: { stocks: 85, bonds: 10, cash: 5 },
      },
      suitableAssets: [
        'Growth-focused index funds',
        'Aggressive diversified portfolios',
        'Tax-advantaged retirement accounts',
        'Long-term growth equities',
        'Small and mid-cap funds',
      ],
    },
    BARISTA_FIRE: {
      explanation: 'You align with Barista FIRE, planning to supplement your investment income with part-time work. This provides flexibility, social engagement, and reduces the required nest egg while maintaining healthcare benefits.',
      baseSWR: 3.5,
      suggestedSavingsRate: 45,
      assetAllocation: {
        conservative: { stocks: 55, bonds: 35, cash: 10 },
        moderate: { stocks: 65, bonds: 25, cash: 10 },
        aggressive: { stocks: 75, bonds: 20, cash: 5 },
      },
      suitableAssets: [
        'Balanced index funds',
        'Total market index ETFs',
        'Bond ladders for stability',
        'Tax-efficient growth funds',
        'Low-cost accumulating ETFs',
      ],
    },
  };

  const personaRec = recommendations[persona];
  let allocation = { ...personaRec.assetAllocation[riskTolerance] };
  let safeWithdrawalRate = personaRec.baseSWR;

  // Adjust SWR based on retirement timeline
  // The 4% rule is a fallacy for early retirement (50+ years in retirement)
  // Max 3% SWR for very early FIRE (before 40)
  if (retirementTimeline === 'very_early') {
    safeWithdrawalRate = Math.min(safeWithdrawalRate, 3.0);
  } else if (retirementTimeline === 'early') {
    safeWithdrawalRate = Math.min(safeWithdrawalRate, 3.25);
  }
  // For standard/flexible timelines, base SWR is appropriate

  // Adjust SWR based on legacy preference
  // "Die with zero" allows higher withdrawal rates since capital preservation isn't a goal
  // "Leave a legacy" requires lower rates to ensure wealth preservation
  if (legacyPreference === 'die_with_zero') {
    safeWithdrawalRate += 0.5; // Can withdraw more if not preserving capital
  } else if (legacyPreference === 'minimal_legacy') {
    safeWithdrawalRate += 0.25; // Slight increase, just need to cover basics
  } else if (legacyPreference === 'moderate_legacy') {
    // No adjustment - base rate is appropriate
  } else if (legacyPreference === 'large_legacy') {
    safeWithdrawalRate -= 0.25; // Lower rate to preserve and grow wealth
  }

  // Adjust asset allocation based on age
  // Younger investors can handle more stocks, older need more bonds
  if (currentAge === 'age_20_30') {
    // Young investors: more stocks, less bonds
    allocation.stocks = Math.min(95, allocation.stocks + 10);
    allocation.bonds = Math.max(5, allocation.bonds - 10);
  } else if (currentAge === 'age_30_40') {
    // Early career: slightly more stocks
    allocation.stocks = Math.min(90, allocation.stocks + 5);
    allocation.bonds = Math.max(5, allocation.bonds - 5);
  } else if (currentAge === 'age_50_plus') {
    // Closer to retirement: more bonds for stability
    allocation.stocks = Math.max(40, allocation.stocks - 10);
    allocation.bonds = allocation.bonds + 10;
  }
  // age_40_50 uses base allocation (no adjustment)

  return {
    explanation: personaRec.explanation,
    safeWithdrawalRate,
    suggestedSavingsRate: personaRec.suggestedSavingsRate,
    assetAllocation: allocation,
    suitableAssets: personaRec.suitableAssets,
  };
}

/**
 * Get persona display info
 */
export function getPersonaInfo(persona: FIREPersona): {
  name: string;
  icon: string;
  color: string;
  tagline: string;
} {
  const personaInfo = {
    LEAN_FIRE: {
      name: 'Lean FIRE',
      icon: 'eco',
      color: '#22C55E',
      tagline: 'Minimalist & Frugal',
    },
    REGULAR_FIRE: {
      name: 'Regular FIRE',
      icon: 'home',
      color: '#3B82F6',
      tagline: 'Comfortable & Balanced',
    },
    FAT_FIRE: {
      name: 'Fat FIRE',
      icon: 'diamond',
      color: '#A855F7',
      tagline: 'Luxurious & Abundant',
    },
    COAST_FIRE: {
      name: 'Coast FIRE',
      icon: 'sailing',
      color: '#06B6D4',
      tagline: 'Save Early, Coast Later',
    },
    BARISTA_FIRE: {
      name: 'Barista FIRE',
      icon: 'coffee',
      color: '#F59E0B',
      tagline: 'Semi-Retired Lifestyle',
    },
  };

  return personaInfo[persona];
}
