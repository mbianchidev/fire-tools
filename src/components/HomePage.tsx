import { Link } from 'react-router-dom';
import {
  loadSecurityBannerDismissed,
  saveSecurityBannerDismissed,
} from '../utils/bannerPreferences';
import { useState } from 'react';
import './HomePage.css';

// Check if running on GitHub Pages (computed once on module load)
const isGitHubPages =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'github.io' ||
    window.location.hostname.endsWith('.github.io'));

// Compute initial banner state synchronously to prevent CLS
function getInitialBannerState(): boolean {
  if (!isGitHubPages) {
    return false;
  }
  return !loadSecurityBannerDismissed();
}

export function HomePage() {
  // Initialize state synchronously to prevent layout shift
  const [showSecurityBanner, setShowSecurityBanner] = useState(getInitialBannerState);

  const handleDismissSecurityBanner = () => {
    saveSecurityBannerDismissed(true);
    setShowSecurityBanner(false);
  };

  return (
    <main className="homepage" id="main-content">
      {isGitHubPages && showSecurityBanner && (
        <div className="security-warning-banner">
          <div className="warning-icon">🔒⚠️</div>
          <div className="warning-content">
            <h2 className="warning-heading">Security Notice: GitHub Pages Deployment</h2>
            <p>
              <strong>Warning:</strong> This application is deployed on GitHub Pages, which does not support 
              server-side data storage or HTTP-only cookies. While data is encrypted using AES, 
              it is still vulnerable to XSS attacks and other client-side exploits that could 
              exfiltrate your financial data.
            </p>
            <p>
              <strong>For better security:</strong> We strongly recommend deploying this application 
              locally on your own machine. Local deployment provides better isolation and reduces 
              attack surface.
            </p>
            <div className="warning-actions">
              <a 
                href="https://github.com/mbianchidev/fire-calculator#getting-started" 
                target="_blank" 
                rel="noopener noreferrer"
                className="warning-button"
              >
                📖 View Local Setup Instructions
              </a>
            </div>
          </div>
          <button
            type="button"
            className="warning-close"
            aria-label="Dismiss security notice"
            onClick={handleDismissSecurityBanner}
          >
            ×
          </button>
        </div>
      )}
      <section className="hero-section" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero-title"><span aria-hidden="true">💸</span> Fire Tools</h1>
        <p className="hero-subtitle">Rocket fuel for your financial planning</p>
      </section>

      <section className="info-section" aria-labelledby="about-title">
        <h2 id="about-title" className="info-section-title">About FIRE Tools</h2>
        <p>
          FIRE Tools is designed to help you plan and achieve Financial Independence Retire Early. 
          Our suite of calculators and tools provides data-driven insights to make informed decisions 
          about your financial future.
        </p>
        <div className="disclaimer" role="note" aria-label="Important disclaimer">
          <strong><span aria-hidden="true">⚠️</span> Disclaimer:</strong> These tools are for educational and planning purposes only. 
          Always consult with a qualified financial advisor before making investment decisions.
        </div>
      </section>

      <section className="features-grid" aria-label="Available tools">
        <Link to="/asset-allocation" className="feature-card" aria-labelledby="asset-allocation-title">
          <div className="feature-icon" aria-hidden="true">📊</div>
          <h3 id="asset-allocation-title" className="feature-card-title">Asset Allocation Manager</h3>
          <p>
            Manage your investment portfolio with intelligent asset allocation tools, 
            rebalancing strategies, and DCA helper functionality.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item"><span aria-hidden="true">💼</span> Portfolio Management</span>
            <span className="highlight-item"><span aria-hidden="true">⚖️</span> Rebalancing Tools</span>
            <span className="highlight-item"><span aria-hidden="true">📉</span> DCA Helper</span>
          </div>
          <span className="cta-link" aria-hidden="true">Manage Portfolio →</span>
        </Link>

        <Link to="/expense-tracker" className="feature-card" aria-labelledby="expense-tracker-title">
          <div className="feature-icon" aria-hidden="true">💰</div>
          <h3 id="expense-tracker-title" className="feature-card-title">Cashflow Tracker</h3>
          <p>
            Track your income and expenses, set budgets per category, and gain insights 
            into your spending patterns with the 50/30/20 budgeting rule.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item"><span aria-hidden="true">📝</span> Transaction Tracking</span>
            <span className="highlight-item"><span aria-hidden="true">💵</span> Budget Management</span>
            <span className="highlight-item"><span aria-hidden="true">📊</span> Spending Analytics</span>
          </div>
          <span className="cta-link" aria-hidden="true">Track Cashflow →</span>
        </Link>

        <Link to="/net-worth-tracker" className="feature-card" aria-labelledby="net-worth-title">
          <div className="feature-icon" aria-hidden="true">📈</div>
          <h3 id="net-worth-title" className="feature-card-title">Net Worth Tracker</h3>
          <p>
            Track your financial operations and net worth on a monthly basis. Monitor assets, 
            cash, pensions, and progress toward FIRE.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item"><span aria-hidden="true">💼</span> Assets & Holdings</span>
            <span className="highlight-item"><span aria-hidden="true">💵</span> Cash & Liquidity</span>
            <span className="highlight-item"><span aria-hidden="true">🧓</span> Pension Tracking</span>
          </div>
          <span className="cta-link" aria-hidden="true">Track Net Worth →</span>
        </Link>

        <Link to="/fire-calculator" className="feature-card" aria-labelledby="fire-calc-title">
          <div className="feature-icon" aria-hidden="true">🔥</div>
          <h3 id="fire-calc-title" className="feature-card-title">FIRE Calculator</h3>
          <p>
            Calculate your path to financial independence with comprehensive projections 
            and detailed analysis of your retirement timeline.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item"><span aria-hidden="true">📊</span> Visual Projections</span>
            <span className="highlight-item"><span aria-hidden="true">📈</span> Net Worth Tracking</span>
            <span className="highlight-item"><span aria-hidden="true">💰</span> Income & Expenses</span>
          </div>
          <span className="cta-link" aria-hidden="true">Start Planning →</span>
        </Link>

        <Link to="/monte-carlo" className="feature-card" aria-labelledby="monte-carlo-title">
          <div className="feature-icon" aria-hidden="true">🎲</div>
          <h3 id="monte-carlo-title" className="feature-card-title">Monte Carlo Simulations</h3>
          <p>
            Run thousands of simulations with randomized market returns to assess the 
            probability of reaching FIRE and account for market volatility.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item"><span aria-hidden="true">🎯</span> Success Probability</span>
            <span className="highlight-item"><span aria-hidden="true">📉</span> Volatility Analysis</span>
            <span className="highlight-item"><span aria-hidden="true">⚡</span> Black Swan Events</span>
          </div>
          <span className="cta-link" aria-hidden="true">Run Simulations →</span>
        </Link>
      </section>
    </main>
  );
}
