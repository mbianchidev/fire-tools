import { Link } from 'react-router-dom';
import './HomePage.css';

export function HomePage() {
  // Check if running on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');

  return (
    <div className="homepage">
      {isGitHubPages && (
        <div className="security-warning-banner">
          <div className="warning-icon">🔒⚠️</div>
          <div className="warning-content">
            <h3>Security Notice: GitHub Pages Deployment</h3>
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
        </div>
      )}

      <div className="hero-section">
        <h1 className="hero-title">🔥 Fire Tools</h1>
        <p className="hero-subtitle">
          Your comprehensive toolkit for Financial Independence Retire Early (FIRE) planning
        </p>
      </div>

      <div className="features-grid">
        <Link to="/fire-calculator" className="feature-card">
          <div className="feature-icon">🔥</div>
          <h2>FIRE Calculator</h2>
          <p>
            Calculate your path to financial independence with comprehensive projections 
            and detailed analysis of your retirement timeline.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item">📊 Visual Projections</span>
            <span className="highlight-item">📈 Net Worth Tracking</span>
            <span className="highlight-item">💰 Income & Expenses</span>
          </div>
          <span className="cta-link">Start Planning →</span>
        </Link>

        <Link to="/monte-carlo" className="feature-card">
          <div className="feature-icon">🎲</div>
          <h2>Monte Carlo Simulations</h2>
          <p>
            Run thousands of simulations with randomized market returns to assess the 
            probability of reaching FIRE and account for market volatility.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item">🎯 Success Probability</span>
            <span className="highlight-item">📉 Volatility Analysis</span>
            <span className="highlight-item">⚡ Black Swan Events</span>
          </div>
          <span className="cta-link">Run Simulations →</span>
        </Link>

        <Link to="/asset-allocation" className="feature-card">
          <div className="feature-icon">📊</div>
          <h2>Asset Allocation Manager</h2>
          <p>
            Manage your investment portfolio with intelligent asset allocation tools, 
            rebalancing strategies, and DCA helper functionality.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item">💼 Portfolio Management</span>
            <span className="highlight-item">⚖️ Rebalancing Tools</span>
            <span className="highlight-item">📉 DCA Helper</span>
          </div>
          <span className="cta-link">Manage Portfolio →</span>
        </Link>
      </div>

      <div className="info-section">
        <h3>About FIRE Tools</h3>
        <p>
          FIRE Tools is designed to help you plan and achieve Financial Independence Retire Early. 
          Our suite of calculators and tools provides data-driven insights to make informed decisions 
          about your financial future.
        </p>
        <div className="disclaimer">
          <strong>⚠️ Disclaimer:</strong> These tools are for educational and planning purposes only. 
          Always consult with a qualified financial advisor before making investment decisions.
        </div>
      </div>
    </div>
  );
}
