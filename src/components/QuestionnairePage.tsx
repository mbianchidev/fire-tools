/**
 * FIRE Questionnaire Page Component
 * Multi-step wizard for identifying FIRE persona and getting recommendations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QUESTIONNAIRE_QUESTIONS, 
  calculateFIREPersona,
  getPersonaInfo 
} from '../utils/questionnaireLogic';
import { 
  saveQuestionnaireResults, 
  loadQuestionnaireResults,
  clearQuestionnaireResults 
} from '../utils/questionnaireStorage';
import { exportQuestionnaireResultsToCSV } from '../utils/csvExport';
import { QuestionnaireResponse, QuestionnaireResults } from '../types/questionnaire';
import { MaterialIcon } from './MaterialIcon';
import './QuestionnairePage.css';

export const QuestionnairePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [results, setResults] = useState<QuestionnaireResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Load existing results on mount
  useEffect(() => {
    const savedResults = loadQuestionnaireResults();
    if (savedResults) {
      setResults(savedResults);
      setResponses(savedResults.responses);
      setShowResults(true);
    }
  }, []);

  const totalSteps = QUESTIONNAIRE_QUESTIONS.length;
  const currentQuestion = QUESTIONNAIRE_QUESTIONS[currentStep];
  const progress = (currentStep / totalSteps) * 100;

  // Handle option selection
  const handleOptionSelect = (optionId: string) => {
    const newResponse: QuestionnaireResponse = {
      questionId: currentQuestion.id,
      selectedOptionId: optionId,
    };

    // Update or add response
    const existingIndex = responses.findIndex(r => r.questionId === currentQuestion.id);
    let newResponses: QuestionnaireResponse[];
    
    if (existingIndex >= 0) {
      newResponses = [...responses];
      newResponses[existingIndex] = newResponse;
    } else {
      newResponses = [...responses, newResponse];
    }

    setResponses(newResponses);

    // Trigger animation and move to next question
    setAnimationKey(prev => prev + 1);
    
    setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Calculate and show results
        const calculatedResults = calculateFIREPersona(newResponses);
        setResults(calculatedResults);
        saveQuestionnaireResults(calculatedResults);
        setShowResults(true);
      }
    }, 300);
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setAnimationKey(prev => prev + 1);
    }
  };

  // Handle retake
  const handleRetake = () => {
    setResponses([]);
    setResults(null);
    setShowResults(false);
    setCurrentStep(0);
    setAnimationKey(prev => prev + 1);
    clearQuestionnaireResults();
  };

  // Handle export
  const handleExport = () => {
    if (!results) return;

    const csv = exportQuestionnaireResultsToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fire-questionnaire-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check if current question has been answered
  const currentResponse = responses.find(r => r.questionId === currentQuestion?.id);
  const selectedOptionId = currentResponse?.selectedOptionId;

  // Render results page
  if (showResults && results) {
    const personaInfo = getPersonaInfo(results.persona);
    
    return (
      <div className="questionnaire-page">
        <div className="questionnaire-container">
          {/* Disclaimer Banner */}
          <div className="disclaimer-banner">
            <MaterialIcon name="info" />
            <span>
              This is not financial advice. Do your own research and consult a qualified financial advisor.
            </span>
          </div>

          {/* Results Header */}
          <div className="results-header">
            <div className="celebration-animation">
              <MaterialIcon name="celebration" className="celebration-icon" />
            </div>
            <h1>Your FIRE Persona</h1>
            <p className="results-subtitle">Based on your responses, here's your personalized FIRE strategy</p>
          </div>

          {/* Persona Card */}
          <div className="persona-card" style={{ '--persona-color': personaInfo.color } as React.CSSProperties}>
            <div className="persona-icon-large">
              <MaterialIcon name={personaInfo.icon} />
            </div>
            <h2 className="persona-name">{personaInfo.name}</h2>
            <p className="persona-tagline">{personaInfo.tagline}</p>
            <p className="persona-explanation">{results.personaExplanation}</p>
          </div>

          {/* Key Metrics */}
          <div className="results-metrics">
            <div className="metric-card">
              <div className="metric-icon">
                <MaterialIcon name="percent" />
              </div>
              <div className="metric-content">
                <div className="metric-label">Safe Withdrawal Rate</div>
                <div className="metric-value">{results.safeWithdrawalRate}%</div>
                <div className="metric-description">Annual withdrawal from portfolio</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <MaterialIcon name="savings" />
              </div>
              <div className="metric-content">
                <div className="metric-label">Target Savings Rate</div>
                <div className="metric-value">{results.suggestedSavingsRate}%</div>
                <div className="metric-description">Percentage of income to save</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <MaterialIcon name="psychology" />
              </div>
              <div className="metric-content">
                <div className="metric-label">Risk Tolerance</div>
                <div className="metric-value risk-tolerance">
                  {results.riskTolerance.charAt(0).toUpperCase() + results.riskTolerance.slice(1)}
                </div>
                <div className="metric-description">Investment risk profile</div>
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="results-section">
            <h3>
              <MaterialIcon name="pie_chart" />
              Recommended Asset Allocation
            </h3>
            <div className="allocation-chart">
              <div className="allocation-pie">
                {/* Simple visual representation */}
                <div className="allocation-segments">
                  <div 
                    className="allocation-segment stocks"
                    style={{ '--segment-size': `${results.assetAllocation.stocks}%` } as React.CSSProperties}
                  >
                    <span className="segment-label">
                      Stocks<br />{results.assetAllocation.stocks}%
                    </span>
                  </div>
                  <div 
                    className="allocation-segment bonds"
                    style={{ '--segment-size': `${results.assetAllocation.bonds}%` } as React.CSSProperties}
                  >
                    <span className="segment-label">
                      Bonds<br />{results.assetAllocation.bonds}%
                    </span>
                  </div>
                  <div 
                    className="allocation-segment cash"
                    style={{ '--segment-size': `${results.assetAllocation.cash}%` } as React.CSSProperties}
                  >
                    <span className="segment-label">
                      Cash<br />{results.assetAllocation.cash}%
                    </span>
                  </div>
                  {results.assetAllocation.crypto && results.assetAllocation.crypto > 0 && (
                    <div 
                      className="allocation-segment crypto"
                      style={{ '--segment-size': `${results.assetAllocation.crypto}%` } as React.CSSProperties}
                    >
                      <span className="segment-label">
                        Crypto<br />{results.assetAllocation.crypto}%
                      </span>
                    </div>
                  )}
                  {results.assetAllocation.realEstate && results.assetAllocation.realEstate > 0 && (
                    <div 
                      className="allocation-segment real-estate"
                      style={{ '--segment-size': `${results.assetAllocation.realEstate}%` } as React.CSSProperties}
                    >
                      <span className="segment-label">
                        Real Estate<br />{results.assetAllocation.realEstate}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Suitable Assets */}
          <div className="results-section">
            <h3>
              <MaterialIcon name="inventory_2" />
              Suitable Asset Types
            </h3>
            <ul className="assets-list">
              {results.suitableAssets.map((asset, index) => (
                <li key={index} className="asset-item">
                  <MaterialIcon name="check_circle" />
                  <span>{asset}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="results-actions">
            <button className="btn-secondary" onClick={handleRetake}>
              <MaterialIcon name="refresh" />
              Retake Questionnaire
            </button>
            <button className="btn-primary" onClick={handleExport}>
              <MaterialIcon name="download" />
              Export Results
            </button>
            <button className="btn-secondary" onClick={() => navigate('/fire-calculator')}>
              <MaterialIcon name="calculate" />
              Go to FIRE Calculator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render questionnaire wizard
  return (
    <div className="questionnaire-page">
      <div className="questionnaire-container">
        {/* Header */}
        <div className="questionnaire-header">
          <h1>
            <MaterialIcon name="quiz" className="page-header-emoji" />
            FIRE Persona Questionnaire
          </h1>
          <p className="questionnaire-subtitle">
            Answer 12 questions to discover your ideal FIRE strategy and get personalized recommendations
          </p>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            Question {currentStep + 1} of {totalSteps}
          </div>
        </div>

        {/* Question Card */}
        <div className="question-card" key={animationKey}>
          <div className="question-category">
            <MaterialIcon name="label" />
            {currentQuestion.category.replace('_', ' ').toUpperCase()}
          </div>
          <h2 className="question-text">{currentQuestion.text}</h2>
          {currentQuestion.description && (
            <p className="question-description">{currentQuestion.description}</p>
          )}

          {/* Options */}
          <div className="options-grid">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                className={`option-card ${selectedOptionId === option.id ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option.id)}
              >
                {option.icon && (
                  <div className="option-icon">
                    <MaterialIcon name={option.icon} />
                  </div>
                )}
                <div className="option-label">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="questionnaire-nav">
          {currentStep > 0 && (
            <button className="btn-back" onClick={handleBack}>
              <MaterialIcon name="arrow_back" />
              Back
            </button>
          )}
          <button 
            className="btn-text"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
