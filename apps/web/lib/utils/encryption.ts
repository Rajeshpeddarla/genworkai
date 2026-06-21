import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('FATAL: ENCRYPTION_KEY environment variable is missing.');
}

if (Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
  throw new Error('FATAL: ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).');
}

const getKey = () => {
  return Buffer.from(ENCRYPTION_KEY, 'hex');
};

export const EncryptionUtil = {
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encryptedText
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  },

  decrypt(hash: string): string {
    const parts = hash.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const ivHex = parts[0] as string;
    const authTagHex = parts[1] as string;
    const encryptedTextHex = parts[2] as string;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedTextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
};
