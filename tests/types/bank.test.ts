import { describe, expect, it } from 'vitest';
import {
  BankInfo,
  OPENBANKING_BANKS,
  getBanksByCountry,
  getBankByCode,
  isOpenBankingSupported,
  INSTITUTION_TYPES,
} from '../../src/types/bank';

describe('Bank Types', () => {
  describe('OPENBANKING_BANKS', () => {
    it('should contain banks from multiple countries', () => {
      const countries = new Set(OPENBANKING_BANKS.map(bank => bank.countryCode));
      expect(countries.size).toBeGreaterThan(5);
    });

    it('should have required fields for all banks', () => {
      OPENBANKING_BANKS.forEach(bank => {
        expect(bank.code).toBeDefined();
        expect(bank.name).toBeDefined();
        expect(bank.countryCode).toBeDefined();
        expect(typeof bank.supportsOpenBanking).toBe('boolean');
      });
    });

    it('should include major European banks', () => {
      const bankNames = OPENBANKING_BANKS.map(b => b.name.toLowerCase());
      // Check for presence of major banks
      expect(bankNames.some(n => n.includes('deutsche'))).toBe(true);
      expect(bankNames.some(n => n.includes('ing'))).toBe(true);
    });
  });

  describe('INSTITUTION_TYPES', () => {
    it('should contain bank and broker types', () => {
      expect(INSTITUTION_TYPES).toContain('BANK');
      expect(INSTITUTION_TYPES).toContain('BROKER');
      expect(INSTITUTION_TYPES).toContain('NEOBANK');
    });
  });

  describe('getBanksByCountry', () => {
    it('should return banks for a valid country code', () => {
      const banks = getBanksByCountry('DE');
      expect(banks.length).toBeGreaterThan(0);
      banks.forEach(bank => {
        expect(bank.countryCode).toBe('DE');
      });
    });

    it('should return empty array for country with no banks', () => {
      const banks = getBanksByCountry('XX');
      expect(banks).toEqual([]);
    });

    it('should be case insensitive', () => {
      const banks1 = getBanksByCountry('DE');
      const banks2 = getBanksByCountry('de');
      expect(banks1).toEqual(banks2);
    });
  });

  describe('getBankByCode', () => {
    it('should return bank info for valid code', () => {
      // Assuming we have a bank with a known code
      const bank = getBankByCode('DE_DEUTSCHE_BANK');
      expect(bank).toBeDefined();
      expect(bank?.name).toContain('Deutsche');
    });

    it('should return undefined for invalid code', () => {
      const bank = getBankByCode('INVALID_CODE');
      expect(bank).toBeUndefined();
    });
  });

  describe('isOpenBankingSupported', () => {
    it('should return true for banks that support OpenBanking', () => {
      // Find a bank that supports OpenBanking
      const supportedBank = OPENBANKING_BANKS.find(b => b.supportsOpenBanking);
      if (supportedBank) {
        expect(isOpenBankingSupported(supportedBank.code)).toBe(true);
      }
    });

    it('should return false for invalid bank codes', () => {
      expect(isOpenBankingSupported('INVALID_CODE')).toBe(false);
    });

    it('should return false for banks without OpenBanking support', () => {
      const unsupportedBank = OPENBANKING_BANKS.find(b => !b.supportsOpenBanking);
      if (unsupportedBank) {
        expect(isOpenBankingSupported(unsupportedBank.code)).toBe(false);
      }
    });
  });
});

describe('BankInfo interface', () => {
  it('should allow creating valid BankInfo objects', () => {
    const bank: BankInfo = {
      code: 'TEST_BANK',
      name: 'Test Bank',
      countryCode: 'DE',
      supportsOpenBanking: true,
      bic: 'TESTDEFF',
      institutionType: 'BANK',
    };
    
    expect(bank.code).toBe('TEST_BANK');
    expect(bank.name).toBe('Test Bank');
    expect(bank.countryCode).toBe('DE');
    expect(bank.supportsOpenBanking).toBe(true);
    expect(bank.bic).toBe('TESTDEFF');
    expect(bank.institutionType).toBe('BANK');
  });

  it('should allow BankInfo without optional fields', () => {
    const bank: BankInfo = {
      code: 'TEST_BANK',
      name: 'Test Bank',
      countryCode: 'DE',
      supportsOpenBanking: false,
    };
    
    expect(bank.bic).toBeUndefined();
    expect(bank.institutionType).toBeUndefined();
  });
});
