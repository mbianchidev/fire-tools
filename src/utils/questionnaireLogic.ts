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
    id: 'q2_retirement_timeline',
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
    id: 'q3_lifestyle_expectations',
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
    id: 'q4_income_stability',
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
    id: 'q5_income_growth',
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
    id: 'q6_work_preference',
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
    id: 'q7_family_plans',
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
    id: 'q8_housing',
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
    id: 'q9_state_pension',
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
    id: 'q10_emergency_fund',
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
    id: 'q11_market_volatility',
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
    id: 'q12_health_concerns',
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
  
  // Q1: Risk Tolerance
  const riskTolerance = getResponse('q1_risk_tolerance');
  if (riskTolerance === 'conservative') {
    scores.regularFire += 3;
    scores.leanFire += 2;
    scores.coastFire += 2;
  } else if (riskTolerance === 'moderate') {
    scores.regularFire += 3;
    scores.fatFire += 2;
    scores.baristaFire += 2;
  } else if (riskTolerance === 'aggressive') {
    scores.fatFire += 3;
    scores.coastFire += 2;
    scores.baristaFire += 1;
  }

  // Q2: Retirement Timeline
  const timeline = getResponse('q2_retirement_timeline');
  if (timeline === 'very_early') {
    scores.leanFire += 4;
    scores.coastFire += 3;
  } else if (timeline === 'early') {
    scores.leanFire += 2;
    scores.regularFire += 3;
    scores.baristaFire += 2;
  } else if (timeline === 'standard') {
    scores.regularFire += 3;
    scores.fatFire += 2;
  } else if (timeline === 'flexible') {
    scores.coastFire += 4;
    scores.baristaFire += 3;
  }

  // Q3: Lifestyle Expectations
  const lifestyle = getResponse('q3_lifestyle_expectations');
  if (lifestyle === 'frugal') {
    scores.leanFire += 5;
    scores.coastFire += 2;
  } else if (lifestyle === 'comfortable') {
    scores.regularFire += 4;
    scores.baristaFire += 2;
  } else if (lifestyle === 'abundant') {
    scores.fatFire += 3;
    scores.regularFire += 2;
  } else if (lifestyle === 'luxurious') {
    scores.fatFire += 5;
  }

  // Q4: Income Stability
  const incomeStability = getResponse('q4_income_stability');
  if (incomeStability === 'very_stable' || incomeStability === 'stable') {
    scores.regularFire += 2;
    scores.fatFire += 1;
  } else {
    scores.baristaFire += 2;
    scores.coastFire += 1;
  }

  // Q5: Income Growth
  const incomeGrowth = getResponse('q5_income_growth');
  if (incomeGrowth === 'high_growth') {
    scores.fatFire += 3;
    scores.coastFire += 2;
  } else if (incomeGrowth === 'moderate_growth') {
    scores.regularFire += 3;
    scores.baristaFire += 1;
  } else if (incomeGrowth === 'limited_growth' || incomeGrowth === 'peak_earnings') {
    scores.leanFire += 2;
    scores.baristaFire += 2;
  }

  // Q6: Work Preference
  const workPreference = getResponse('q6_work_preference');
  if (workPreference === 'never_work') {
    scores.leanFire += 2;
    scores.regularFire += 2;
    scores.fatFire += 2;
  } else if (workPreference === 'maybe_hobby') {
    scores.regularFire += 2;
    scores.baristaFire += 1;
  } else if (workPreference === 'part_time') {
    scores.baristaFire += 4;
  } else if (workPreference === 'continue_working') {
    scores.coastFire += 4;
    scores.baristaFire += 2;
  }

  // Q7: Family Plans
  const familyPlans = getResponse('q7_family_plans');
  if (familyPlans === 'no_dependents') {
    scores.leanFire += 3;
    scores.coastFire += 2;
  } else if (familyPlans === 'future_kids' || familyPlans === 'young_kids') {
    scores.regularFire += 2;
    scores.fatFire += 2;
  } else if (familyPlans === 'older_dependents') {
    scores.fatFire += 2;
    scores.baristaFire += 1;
  }

  // Q8: Housing
  const housing = getResponse('q8_housing');
  if (housing === 'own_paid') {
    scores.leanFire += 2;
    scores.regularFire += 2;
  } else if (housing === 'own_mortgage') {
    scores.regularFire += 2;
    scores.fatFire += 1;
  } else if (housing === 'rent_flexible') {
    scores.leanFire += 2;
    scores.coastFire += 1;
  } else if (housing === 'want_to_buy') {
    scores.fatFire += 2;
    scores.baristaFire += 1;
  }

  // Q9: State Pension
  const statePension = getResponse('q9_state_pension');
  if (statePension === 'very_reliable' || statePension === 'somewhat_reliable') {
    scores.coastFire += 3;
    scores.baristaFire += 2;
  } else {
    scores.leanFire += 1;
    scores.regularFire += 1;
    scores.fatFire += 1;
  }

  // Q10: Emergency Fund
  const emergencyFund = getResponse('q10_emergency_fund');
  if (emergencyFund === 'minimal_3m') {
    scores.coastFire += 1;
    scores.baristaFire += 1;
  } else if (emergencyFund === 'standard_6m') {
    scores.regularFire += 2;
  } else if (emergencyFund === 'conservative_12m' || emergencyFund === 'very_large_24m') {
    scores.leanFire += 2;
    scores.regularFire += 1;
  }

  // Q11: Market Volatility
  const marketVolatility = getResponse('q11_market_volatility');
  if (marketVolatility === 'panic_sell' || marketVolatility === 'worry_hold') {
    scores.leanFire += 2;
    scores.regularFire += 2;
  } else if (marketVolatility === 'stay_calm') {
    scores.regularFire += 2;
    scores.fatFire += 1;
  } else if (marketVolatility === 'buy_more') {
    scores.fatFire += 3;
    scores.coastFire += 1;
  }

  // Q12: Health Concerns
  const healthConcerns = getResponse('q12_health_concerns');
  if (healthConcerns === 'excellent_low' || healthConcerns === 'good_average') {
    scores.leanFire += 1;
    scores.coastFire += 1;
  } else if (healthConcerns === 'fair_higher' || healthConcerns === 'concerns_high') {
    scores.fatFire += 2;
    scores.baristaFire += 1;
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
  
  const recommendations = generateRecommendations(winningPersona, riskToleranceValue);

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
 * Generate detailed recommendations based on persona and risk tolerance
 */
function generateRecommendations(
  persona: FIREPersona, 
  riskTolerance: RiskTolerance
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
      safeWithdrawalRate: 3.5,
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
      safeWithdrawalRate: 4.0,
      suggestedSavingsRate: 50,
      assetAllocation: {
        conservative: { stocks: 60, bonds: 30, cash: 10 },
        moderate: { stocks: 70, bonds: 20, cash: 10 },
        aggressive: { stocks: 80, bonds: 15, cash: 5 },
      },
      suitableAssets: [
        'Diversified index funds',
        'Total stock market exchange-traded funds',
        'Aggregate bond funds',
        'Real estate investment trusts (REITs)',
        'Dividend-paying equities',
      ],
    },
    FAT_FIRE: {
      explanation: 'You align with Fat FIRE, pursuing an abundant lifestyle with significant financial cushion. This requires the largest nest egg but provides maximum flexibility and luxury in retirement.',
      safeWithdrawalRate: 3.0,
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
      safeWithdrawalRate: 4.0,
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
      safeWithdrawalRate: 3.5,
      suggestedSavingsRate: 45,
      assetAllocation: {
        conservative: { stocks: 55, bonds: 35, cash: 10 },
        moderate: { stocks: 65, bonds: 25, cash: 10 },
        aggressive: { stocks: 75, bonds: 20, cash: 5 },
      },
      suitableAssets: [
        'Balanced index funds',
        'Dividend-focused funds',
        'Bond ladders for stability',
        'Real estate investment trusts (REITs)',
        'Income-generating investments',
      ],
    },
  };

  const personaRec = recommendations[persona];
  const allocation = personaRec.assetAllocation[riskTolerance];

  return {
    explanation: personaRec.explanation,
    safeWithdrawalRate: personaRec.safeWithdrawalRate,
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
