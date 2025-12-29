/**
 * Cookie Encryption Utilities
 * Provides encryption and decryption for sensitive data stored in cookies
 * Uses AES encryption with a secret key
 */

import CryptoJS from 'crypto-js';

// Secret key for encryption - In production, this should be environment-specific
// For a client-side app, we use a consistent key, but note that client-side
// encryption is mainly for obfuscation, not true security against determined attackers
const ENCRYPTION_KEY = 'fire-calculator-secret-key-v1-2024';

/**
 * Encrypt data using AES encryption
 * @param plaintext - The data to encrypt (as a string)
 * @returns Encrypted string
 */
export function encryptData(plaintext: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY);
    return encrypted.toString();
  } catch (error) {
    console.error('Failed to encrypt data:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data using AES decryption
 * @param ciphertext - The encrypted data to decrypt
 * @returns Decrypted string, or null if decryption fails
 */
export function decryptData(ciphertext: string): string | null {
  try {
    if (!ciphertext || ciphertext.trim() === '') {
      return null;
    }
    
    const decrypted = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption results in an empty string, it likely failed
    if (plaintext === '') {
      return null;
    }
    
    return plaintext;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
}
