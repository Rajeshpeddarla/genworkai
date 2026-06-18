import crypto from 'crypto';

// The ENCRYPTION_KEY must be a 32-byte (256-bit) hex string in production
// It should never be committed to source control.
const getEncryptionKey = (): Buffer => {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is missing.');
  }
  
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 characters).');
  }
  
  return key;
};

export interface EncryptedData {
  version: number;
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * The payload is wrapped in a versioned object to support future key rotation.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV is recommended for GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  
  const payload: EncryptedData = {
    version: 1, // Future iterations can bump this version when rotating keys
    ciphertext,
    iv: iv.toString('base64'),
    authTag
  };
  
  return JSON.stringify(payload);
}

/**
 * Decrypts an AES-256-GCM encrypted payload string.
 * Supports reading the version format to pick the appropriate key or algorithm if changed in the future.
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  
  try {
    const payload: EncryptedData = JSON.parse(encryptedPayload);
    
    // Only support version 1 for now
    if (payload.version !== 1) {
      throw new Error(`Unsupported encryption version: ${payload.version}`);
    }
    
    const key = getEncryptionKey();
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let plaintext = decipher.update(payload.ciphertext, 'base64', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (err: any) {
    // If it's not a valid JSON structure, assume it's legacy plaintext (pre-migration)
    // In strict environments, you might want to force decryption and throw.
    // For seamless migrations, falling back to returning the plaintext is safer
    // until all rows are confirmed encrypted.
    if (err instanceof SyntaxError) {
      console.warn('Warning: Treating string as legacy plaintext because JSON parse failed.', err.message);
      return encryptedPayload;
    }
    throw new Error(`Failed to decrypt secret: ${err.message}`);
  }
}

/**
 * Checks if a string appears to be a valid encrypted payload.
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  try {
    const payload = JSON.parse(value);
    return !!(payload && payload.version && payload.ciphertext && payload.iv && payload.authTag);
  } catch {
    return false;
  }
}
