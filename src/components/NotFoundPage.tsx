import { Link } from 'react-router-dom';
import { MaterialIcon } from './MaterialIcon';
import './NotFoundPage.css';

export function NotFoundPage() {
  return (
    <main className="not-found-page" id="main-content">
      <div className="not-found-container">
        <div className="not-found-icon" aria-hidden="true"><MaterialIcon name="search" size="large" /></div>
        <h1 className="not-found-title">404 - Page Not Found</h1>
        <p className="not-found-message">
          Oops! The page you're looking for doesn't exist. 
          It might have been moved or deleted.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn-home">
            <MaterialIcon name="home" /> Back to Home
          </Link>
          <Link to="/fire-calculator" className="btn-calculator">
            <MaterialIcon name="local_fire_department" /> FIRE Calculator
          </Link>
        </div>
        <div className="helpful-links">
          <h2>Popular Pages</h2>
          <nav aria-label="Popular pages navigation">
            <ul>
              <li>
                <Link to="/asset-allocation">
                  <MaterialIcon name="pie_chart" /> Asset Allocation Manager
                </Link>
              </li>
              <li>
                <Link to="/expense-tracker">
                  <MaterialIcon name="account_balance_wallet" /> Cashflow Tracker
                </Link>
              </li>
              <li>
                <Link to="/monte-carlo">
                  <MaterialIcon name="casino" /> Monte Carlo Simulations
                </Link>
              </li>
              <li>
                <Link to="/settings">
                  <MaterialIcon name="settings" /> Settings
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}
