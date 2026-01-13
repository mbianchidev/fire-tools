import { describe, expect, it } from 'vitest';
import {
  isEUCountry,
  isUCITSCompliant,
  getUCITSWarning,
  getCountryByCode,
  EU_COUNTRIES,
  OTHER_COUNTRIES,
  ALL_COUNTRIES,
  UCITS_ISIN_PREFIXES,
} from '../../src/types/country';

describe('Country Types', () => {
  describe('EU_COUNTRIES', () => {
    it('should contain 27 EU member states', () => {
      expect(EU_COUNTRIES.length).toBe(27);
    });

    it('should mark all entries as EU countries', () => {
      EU_COUNTRIES.forEach(country => {
        expect(country.isEU).toBe(true);
      });
    });

    it('should include major EU countries', () => {
      const codes = EU_COUNTRIES.map(c => c.code);
      expect(codes).toContain('DE');
      expect(codes).toContain('FR');
      expect(codes).toContain('IT');
      expect(codes).toContain('ES');
      expect(codes).toContain('NL');
      expect(codes).toContain('IE');
      expect(codes).toContain('LU');
    });

    it('should have flag emojis for all EU countries', () => {
      EU_COUNTRIES.forEach(country => {
        expect(country.flag).toBeDefined();
        expect(country.flag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('OTHER_COUNTRIES', () => {
    it('should mark all entries as non-EU', () => {
      OTHER_COUNTRIES.forEach(country => {
        expect(country.isEU).toBe(false);
      });
    });

    it('should include common non-EU countries', () => {
      const codes = OTHER_COUNTRIES.map(c => c.code);
      expect(codes).toContain('US');
      expect(codes).toContain('GB');
      expect(codes).toContain('CH');
    });

    it('should have flag emojis for all other countries', () => {
      OTHER_COUNTRIES.forEach(country => {
        expect(country.flag).toBeDefined();
        expect(country.flag.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ALL_COUNTRIES', () => {
    it('should be sorted alphabetically by name', () => {
      const names = ALL_COUNTRIES.map(c => c.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });

    it('should contain all EU and other countries', () => {
      expect(ALL_COUNTRIES.length).toBe(EU_COUNTRIES.length + OTHER_COUNTRIES.length);
    });
  });

  describe('UCITS_ISIN_PREFIXES', () => {
    it('should include Ireland and Luxembourg', () => {
      expect(UCITS_ISIN_PREFIXES).toContain('IE');
      expect(UCITS_ISIN_PREFIXES).toContain('LU');
    });

    it('should include major EU domiciles for ETFs', () => {
      expect(UCITS_ISIN_PREFIXES).toContain('DE');
      expect(UCITS_ISIN_PREFIXES).toContain('FR');
    });
  });
});

describe('isEUCountry', () => {
  it('should return true for EU countries', () => {
    expect(isEUCountry('DE')).toBe(true);
    expect(isEUCountry('FR')).toBe(true);
    expect(isEUCountry('IT')).toBe(true);
    expect(isEUCountry('ES')).toBe(true);
    expect(isEUCountry('IE')).toBe(true);
    expect(isEUCountry('LU')).toBe(true);
  });

  it('should return false for non-EU countries', () => {
    expect(isEUCountry('US')).toBe(false);
    expect(isEUCountry('GB')).toBe(false);
    expect(isEUCountry('CH')).toBe(false);
    expect(isEUCountry('JP')).toBe(false);
  });

  it('should return false for unknown country codes', () => {
    expect(isEUCountry('XX')).toBe(false);
    expect(isEUCountry('')).toBe(false);
  });
});

describe('isUCITSCompliant', () => {
  it('should return true for Irish domiciled ETFs', () => {
    expect(isUCITSCompliant('IE00B4L5Y983')).toBe(true);
    expect(isUCITSCompliant('IE00BK5BQT80')).toBe(true);
  });

  it('should return true for Luxembourg domiciled ETFs', () => {
    expect(isUCITSCompliant('LU0290358497')).toBe(true);
  });

  it('should return true for German domiciled ETFs', () => {
    expect(isUCITSCompliant('DE0005933931')).toBe(true);
  });

  it('should return false for US domiciled ETFs', () => {
    expect(isUCITSCompliant('US78462F1030')).toBe(false);
    expect(isUCITSCompliant('US4642872349')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isUCITSCompliant('ie00B4L5Y983')).toBe(true);
    expect(isUCITSCompliant('us78462F1030')).toBe(false);
  });

  it('should return false for empty or invalid ISINs', () => {
    expect(isUCITSCompliant('')).toBe(false);
    expect(isUCITSCompliant('X')).toBe(false);
  });
});

describe('getUCITSWarning', () => {
  it('should return null for non-EU users', () => {
    expect(getUCITSWarning('US78462F1030', 'US')).toBeNull();
    expect(getUCITSWarning('US78462F1030', 'GB')).toBeNull();
    expect(getUCITSWarning('US78462F1030', undefined)).toBeNull();
  });

  it('should return null for UCITS-compliant ETFs', () => {
    expect(getUCITSWarning('IE00B4L5Y983', 'DE')).toBeNull();
    expect(getUCITSWarning('LU0290358497', 'FR')).toBeNull();
    expect(getUCITSWarning('DE0005933931', 'IT')).toBeNull();
  });

  it('should return warning for non-UCITS ETFs when user is in EU', () => {
    const warning = getUCITSWarning('US78462F1030', 'DE');
    expect(warning).not.toBeNull();
    expect(warning).toContain('US');
    expect(warning).toContain('UCITS');
  });

  it('should return null for empty or invalid ISINs', () => {
    expect(getUCITSWarning('', 'DE')).toBeNull();
    expect(getUCITSWarning('X', 'DE')).toBeNull();
  });
});

describe('getCountryByCode', () => {
  it('should return country info for valid codes', () => {
    const germany = getCountryByCode('DE');
    expect(germany).toBeDefined();
    expect(germany?.name).toBe('Germany');
    expect(germany?.isEU).toBe(true);
  });

  it('should return country info for non-EU countries', () => {
    const us = getCountryByCode('US');
    expect(us).toBeDefined();
    expect(us?.name).toBe('United States');
    expect(us?.isEU).toBe(false);
  });

  it('should return undefined for unknown codes', () => {
    expect(getCountryByCode('XX')).toBeUndefined();
    expect(getCountryByCode('')).toBeUndefined();
  });
});
