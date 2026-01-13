import { describe, expect, it } from 'vitest';
import { encryptData, decryptData } from '../../src/utils/cookieEncryption';

describe('Cookie Encryption Utilities', () => {
  describe('encryptData', () => {
    it('should encrypt a string successfully', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encryptData(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should encrypt an object successfully', () => {
      const data = { name: 'John', age: 30 };
      const encrypted = encryptData(JSON.stringify(data));
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toContain('John');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce different ciphertext for the same plaintext on consecutive calls', () => {
      const plaintext = 'test data';
      const encrypted1 = encryptData(plaintext);
      const encrypted2 = encryptData(plaintext);
      
      // Due to IV randomization, ciphertexts should be different
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const encrypted = encryptData('');
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });
  });

  describe('decryptData', () => {
    it('should decrypt encrypted data back to original', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encryptData(plaintext);
      const decrypted = decryptData(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt encrypted object data back to original', () => {
      const data = { name: 'John', age: 30, active: true };
      const jsonString = JSON.stringify(data);
      const encrypted = encryptData(jsonString);
      const decrypted = decryptData(encrypted);
      
      expect(decrypted).toBe(jsonString);
      expect(decrypted).not.toBeNull();
      if (decrypted) {
        expect(JSON.parse(decrypted)).toEqual(data);
      }
    });

    it('should return null for invalid encrypted data', () => {
      const decrypted = decryptData('invalid-encrypted-data');
      
      expect(decrypted).toBeNull();
    });

    it('should return null for empty string', () => {
      const decrypted = decryptData('');
      
      expect(decrypted).toBeNull();
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        assets: [
          { id: '1', name: 'Stock A', value: 10000 },
          { id: '2', name: 'Bond B', value: 5000 }
        ],
        metadata: {
          lastUpdated: '2024-01-01',
          version: 1
        }
      };
      const jsonString = JSON.stringify(complexData);
      const encrypted = encryptData(jsonString);
      const decrypted = decryptData(encrypted);
      
      expect(decrypted).not.toBeNull();
      if (decrypted) {
        expect(JSON.parse(decrypted)).toEqual(complexData);
      }
    });
  });

  describe('Encryption roundtrip', () => {
    it('should maintain data integrity through encryption and decryption', () => {
      const testCases = [
        'simple string',
        '12345',
        'special chars: !@#$%^&*()',
        JSON.stringify({ test: 'data' }),
        JSON.stringify({ numbers: [1, 2, 3], nested: { key: 'value' } })
      ];

      testCases.forEach((testCase) => {
        const encrypted = encryptData(testCase);
        const decrypted = decryptData(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
