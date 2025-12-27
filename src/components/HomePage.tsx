import { Link } from 'react-router-dom';
import './HomePage.css';

export function HomePage() {
  return (
    <div className="homepage">
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
            Calculate your path to financial independence with comprehensive projections, 
            Monte Carlo simulations, and detailed analysis of your retirement timeline.
          </p>
          <div className="feature-highlights">
            <span className="highlight-item">📊 Visual Projections</span>
            <span className="highlight-item">🎲 Monte Carlo Simulations</span>
            <span className="highlight-item">📈 Net Worth Tracking</span>
          </div>
          <span className="cta-link">Start Planning →</span>
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
