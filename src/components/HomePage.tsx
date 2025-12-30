import { Link } from 'react-router-dom';
import './HomePage.css';

export function HomePage() {
  // Check if running on GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');

  return (
    <main className="homepage" id="main-content">
      <section className="hero-section" aria-labelledby="hero-title">
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
        <h1 id="hero-title" className="hero-title"><span aria-hidden="true">💸</span> Fire Tools</h1>
        <p className="hero-subtitle">
          Rocket fuel for your financial planning 🚀
        </p>
      </section>

      <section className="info-section" aria-labelledby="about-title">
        <h3 id="about-title">About FIRE Tools</h3>
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
          <h2 id="asset-allocation-title">Asset Allocation Manager</h2>
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

        <Link to="/fire-calculator" className="feature-card" aria-labelledby="fire-calc-title">
          <div className="feature-icon" aria-hidden="true">🔥</div>
          <h2 id="fire-calc-title">FIRE Calculator</h2>
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
          <h2 id="monte-carlo-title">Monte Carlo Simulations</h2>
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
