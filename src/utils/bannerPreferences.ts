import Cookies from 'js-cookie';
import { encryptData, decryptData } from './cookieEncryption';

const SECURITY_BANNER_KEY = 'fire-tools-security-banner-dismissed';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 365,
  sameSite: 'strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

export function saveSecurityBannerDismissed(dismissed: boolean): void {
  try {
    const payload = JSON.stringify({ dismissed });
    const encrypted = encryptData(payload);
    Cookies.set(SECURITY_BANNER_KEY, encrypted, COOKIE_OPTIONS);
  } catch (error) {
    console.error('Failed to save security banner preference:', error);
  }
}

export function loadSecurityBannerDismissed(): boolean {
  try {
    const encrypted = Cookies.get(SECURITY_BANNER_KEY);
    if (!encrypted) {
      return false;
    }

    const decrypted = decryptData(encrypted);
    if (!decrypted) {
      return false;
    }

    const parsed = JSON.parse(decrypted);
    return parsed.dismissed === true;
  } catch (error) {
    console.error('Failed to load security banner preference:', error);
    return false;
  }
}

export function clearSecurityBannerPreference(): void {
  try {
    Cookies.remove(SECURITY_BANNER_KEY, { path: '/' });
  } catch (error) {
    console.error('Failed to clear security banner preference:', error);
  }
}
