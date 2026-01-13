/**
 * Notification Generator utilities
 * Creates notifications for various events (time-based, milestones, etc.)
 */

import {
  type Notification,
  type NotificationPreferences,
  createNotification,
} from '../types/notification';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Generate a new month notification
 */
export function generateNewMonthNotification(): Notification {
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();
  
  return createNotification(
    'NEW_MONTH',
    `🗓️ ${monthName} ${year} Started`,
    `It's a new month! Time to update your financial data and track your progress.`,
    {
      priority: 'MEDIUM',
      actionUrl: '/net-worth-tracker',
      actionLabel: 'Update Net Worth',
    }
  );
}

/**
 * Generate a new quarter notification
 */
export function generateNewQuarterNotification(quarter: number): Notification {
  const year = new Date().getFullYear();
  
  return createNotification(
    'NEW_QUARTER',
    `📊 Q${quarter} ${year} Started`,
    `A new quarter has begun! Review your quarterly performance and adjust your FIRE strategy.`,
    {
      priority: 'MEDIUM',
      actionUrl: '/expense-tracker',
      actionLabel: 'Review Quarterly Analytics',
    }
  );
}

/**
 * Generate a tax reminder notification
 */
export function generateTaxReminderNotification(deadline: string): Notification {
  return createNotification(
    'TAX_REMINDER',
    '🏦 Tax Payment Reminder',
    `Tax deadline approaching: ${deadline}. Don't forget to track your tax payments!`,
    {
      priority: 'HIGH',
      actionUrl: '/net-worth-tracker',
      actionLabel: 'Track Taxes',
    }
  );
}

/**
 * Generate a welcome notification for new users
 */
export function generateWelcomeNotification(): Notification {
  return createNotification(
    'WELCOME',
    '👋 Welcome to Fire Tools!',
    'Start your journey to Financial Independence. Check out the guided tour or explore the tools!',
    {
      priority: 'MEDIUM',
      actionUrl: '/settings',
      actionLabel: 'Get Started',
    }
  );
}

/**
 * Generate demo notifications for the guided tour
 */
export function generateDemoTourNotifications(): Notification[] {
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();
  
  const notifications: Notification[] = [
    // Welcome notification
    generateWelcomeNotification(),
    
    // New month notification
    createNotification(
      'NEW_MONTH',
      `🗓️ ${monthName} ${year} Started`,
      'A new month has begun! Update your net worth and track your progress.',
      {
        priority: 'MEDIUM',
        actionUrl: '/net-worth-tracker',
        actionLabel: 'Update Net Worth',
      }
    ),
    
    // Tax reminder
    createNotification(
      'TAX_REMINDER',
      '🏦 Quarterly Tax Reminder',
      'Quarterly tax deadline is approaching. Make sure to set aside funds for taxes!',
      {
        priority: 'HIGH',
        actionUrl: '/net-worth-tracker',
        actionLabel: 'Track Taxes',
      }
    ),
    
    // DCA reminder
    createNotification(
      'DCA_REMINDER',
      '💰 Monthly Investment Reminder',
      'Time for your monthly DCA investment! Check your allocation targets.',
      {
        priority: 'MEDIUM',
        actionUrl: '/asset-allocation',
        actionLabel: 'DCA Helper',
      }
    ),
    
    // FIRE milestone
    createNotification(
      'FIRE_MILESTONE',
      '🔥 FIRE Progress Update',
      'Your portfolio is growing! You\'re on track to reach FIRE in the projected timeframe.',
      {
        priority: 'LOW',
        actionUrl: '/fire-calculator',
        actionLabel: 'View Projections',
      }
    ),
  ];
  
  return notifications;
}

/**
 * Check if a tax reminder should be generated based on preferences
 */
export function shouldGenerateTaxReminder(preferences: NotificationPreferences): boolean {
  if (!preferences.taxReminders) {
    return false;
  }
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  
  // Check if current month is in tax reminder months
  if (!preferences.taxReminderMonths.includes(currentMonth)) {
    return false;
  }
  
  // Get last day of current month
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  // Check if we're within the reminder window (days before end of month)
  const daysUntilEndOfMonth = lastDayOfMonth - currentDay;
  
  return daysUntilEndOfMonth < preferences.taxReminderDaysBefore;
}

/**
 * Get the current quarter (1-4)
 */
function getCurrentQuarter(): number {
  const month = new Date().getMonth(); // 0-11
  return Math.floor(month / 3) + 1;
}

/**
 * Check if today is the first day of a quarter
 */
function isFirstDayOfQuarter(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();
  
  // First day of quarters: Jan 1, Apr 1, Jul 1, Oct 1
  const quarterStartMonths = [0, 3, 6, 9];
  
  return day === 1 && quarterStartMonths.includes(month);
}

/**
 * Check if today is the first day of a month
 */
function isFirstDayOfMonth(): boolean {
  return new Date().getDate() === 1;
}

/**
 * Check if a date is from today
 */
function isFromToday(dateString: string | null): boolean {
  if (!dateString) {
    return false;
  }
  
  const date = new Date(dateString);
  const today = new Date();
  
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Check and generate time-based notifications based on current date and preferences
 */
export function checkAndGenerateTimeBasedNotifications(
  preferences: NotificationPreferences,
  lastChecked: string | null
): Notification[] {
  const notifications: Notification[] = [];
  
  // Don't generate if notifications are disabled
  if (!preferences.enableInAppNotifications) {
    return notifications;
  }
  
  // Don't generate if already checked today
  const alreadyCheckedToday = isFromToday(lastChecked);
  
  // New month reminder
  if (preferences.newMonthReminders && isFirstDayOfMonth() && !alreadyCheckedToday) {
    notifications.push(generateNewMonthNotification());
  }
  
  // New quarter reminder
  if (preferences.newQuarterReminders && isFirstDayOfQuarter() && !alreadyCheckedToday) {
    const quarter = getCurrentQuarter();
    notifications.push(generateNewQuarterNotification(quarter));
  }
  
  // Tax reminder
  if (shouldGenerateTaxReminder(preferences) && !alreadyCheckedToday) {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()];
    const year = now.getFullYear();
    notifications.push(generateTaxReminderNotification(`${monthName} ${year}`));
  }
  
  return notifications;
}

/**
 * Generate a portfolio rebalancing notification
 */
export function generateRebalanceNotification(): Notification {
  return createNotification(
    'PORTFOLIO_REBALANCE',
    '⚖️ Portfolio Rebalancing Needed',
    'Your portfolio allocation has drifted from your targets. Consider rebalancing.',
    {
      priority: 'MEDIUM',
      actionUrl: '/asset-allocation',
      actionLabel: 'View Allocation',
    }
  );
}

/**
 * Generate a DCA reminder notification
 */
export function generateDCAReminder(): Notification {
  return createNotification(
    'DCA_REMINDER',
    '💰 DCA Investment Reminder',
    'Time for your regular investment! Use the DCA helper to allocate your funds.',
    {
      priority: 'MEDIUM',
      actionUrl: '/asset-allocation',
      actionLabel: 'DCA Helper',
    }
  );
}

/**
 * Generate a FIRE milestone notification
 */
export function generateFIREMilestoneNotification(percentToFire: number): Notification {
  let message: string;
  let title: string;
  
  if (percentToFire >= 100) {
    title = '🔥 Congratulations! You\'ve Reached FIRE!';
    message = 'You\'ve achieved Financial Independence! Your portfolio has reached your FIRE target.';
  } else if (percentToFire >= 75) {
    title = '🔥 75% to FIRE!';
    message = 'Amazing progress! You\'re three quarters of the way to Financial Independence.';
  } else if (percentToFire >= 50) {
    title = '🔥 50% to FIRE!';
    message = 'Halfway there! You\'ve reached 50% of your FIRE target.';
  } else if (percentToFire >= 25) {
    title = '🔥 25% to FIRE!';
    message = 'Great start! You\'ve reached a quarter of your FIRE target.';
  } else {
    title = '🔥 FIRE Journey Started';
    message = 'You\'re on your way to Financial Independence! Keep saving and investing.';
  }
  
  return createNotification(
    'FIRE_MILESTONE',
    title,
    message,
    {
      priority: 'LOW',
      actionUrl: '/fire-calculator',
      actionLabel: 'View Progress',
    }
  );
}
