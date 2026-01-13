/**
 * PrivacyBlur Component
 * Wraps content that should be blurred when privacy mode is enabled
 */

import { loadSettings } from '../utils/cookieSettings';
import './PrivacyBlur.css';

interface PrivacyBlurProps {
  children: React.ReactNode;
  /**
   * Whether this content should be blurred when privacy mode is enabled.
   * Set to false for expenses, which should not be blurred.
   */
  shouldBlur?: boolean;
  /**
   * Custom CSS class for additional styling
   */
  className?: string;
}

export const PrivacyBlur: React.FC<PrivacyBlurProps> = ({ 
  children, 
  shouldBlur = true,
  className = '' 
}) => {
  const settings = loadSettings();
  const isBlurred = shouldBlur && settings.privacyMode;

  if (!isBlurred) {
    return <>{children}</>;
  }

  return (
    <span 
      className={`privacy-blur ${className}`} 
      aria-label="Value hidden for privacy"
      title="Privacy mode enabled - value hidden"
    >
      {children}
    </span>
  );
};
