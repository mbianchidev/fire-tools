import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IS_DEMO_MODE } from '../utils/demoMode';
import './DemoBanner.css';

const RELEASES_URL = 'https://github.com/mbianchidev/fire-tools/releases/latest';

export function DemoBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (!IS_DEMO_MODE || dismissed) {
    return null;
  }

  return (
    <div className="demo-banner" role="status" aria-live="polite">
      <div className="demo-banner__inner">
        <span className="demo-banner__icon" aria-hidden="true">🧪</span>
        <span className="demo-banner__text">{t('demo.message')}</span>
        <a
          className="demo-banner__cta"
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('demo.cta')}
        </a>
        <button
          type="button"
          className="demo-banner__close"
          onClick={() => setDismissed(true)}
          aria-label={t('demo.dismiss')}
        >
          ×
        </button>
      </div>
    </div>
  );
}
