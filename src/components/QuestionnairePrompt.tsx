/**
 * Questionnaire Prompt Component
 * Shows a prompt to users who completed the tour but haven't taken the questionnaire
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTourCompleted } from '../utils/tourPreferences';
import { hasCompletedQuestionnaire } from '../utils/questionnaireStorage';
import { 
  loadQuestionnairePromptDismissed, 
  saveQuestionnairePromptDismissed 
} from '../utils/questionnairePromptPreferences';
import { MaterialIcon } from './MaterialIcon';
import './QuestionnairePrompt.css';

export function QuestionnairePrompt() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user should see the questionnaire prompt:
    // 1. Tour is completed
    // 2. Questionnaire is NOT completed
    // 3. User hasn't dismissed the prompt
    const tourCompleted = loadTourCompleted();
    const questionnaireCompleted = hasCompletedQuestionnaire();
    const promptDismissed = loadQuestionnairePromptDismissed();

    if (tourCompleted && !questionnaireCompleted && !promptDismissed) {
      // Delay showing to avoid overwhelming user with multiple prompts
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartQuestionnaire = () => {
    setVisible(false);
    navigate('/questionnaire');
  };

  const handleDismiss = () => {
    saveQuestionnairePromptDismissed(true);
    setVisible(false);
  };

  const handleRemindLater = () => {
    // Just hide for this session without permanently dismissing
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div 
      className="questionnaire-prompt-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="questionnaire-prompt-title"
    >
      <div className="questionnaire-prompt-modal">
        <button 
          className="questionnaire-prompt-close"
          onClick={handleDismiss}
          aria-label="Close and don't ask again"
        >
          <MaterialIcon name="close" />
        </button>
        
        <div className="questionnaire-prompt-icon">
          <MaterialIcon name="quiz" size="large" />
        </div>
        
        <h2 id="questionnaire-prompt-title" className="questionnaire-prompt-title">
          Discover Your FIRE Persona
        </h2>
        
        <p className="questionnaire-prompt-description">
          Take our quick questionnaire to find out which FIRE strategy suits you best. 
          Get personalized recommendations for asset allocation, savings rate, and investment approach.
        </p>
        
        <div className="questionnaire-prompt-features">
          <div className="questionnaire-prompt-feature">
            <MaterialIcon name="timer" size="small" />
            <span>Takes only 2 minutes</span>
          </div>
          <div className="questionnaire-prompt-feature">
            <MaterialIcon name="psychology" size="small" />
            <span>Personalized insights</span>
          </div>
          <div className="questionnaire-prompt-feature">
            <MaterialIcon name="savings" size="small" />
            <span>Tailored recommendations</span>
          </div>
        </div>

        <div className="questionnaire-prompt-actions">
          <button 
            className="questionnaire-prompt-btn questionnaire-prompt-btn-primary"
            onClick={handleStartQuestionnaire}
          >
            <MaterialIcon name="play_arrow" size="small" />
            Start Questionnaire
          </button>
          <button 
            className="questionnaire-prompt-btn questionnaire-prompt-btn-secondary"
            onClick={handleRemindLater}
          >
            Remind Me Later
          </button>
        </div>
        
        <button 
          className="questionnaire-prompt-dismiss-text"
          onClick={handleDismiss}
        >
          Don't show this again
        </button>
      </div>
    </div>
  );
}
