import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateUpload } from '../lib/security/uploads';
import { validateSqlQuery } from '../lib/database/validation';
import { encryptSecret, decryptSecret } from '../lib/security/encryption';

describe('V13: File Upload Limits', () => {
  it('rejects oversized images', () => {
    const file = { size: 21 * 1024 * 1024, type: 'image/jpeg', name: 'large.jpg' } as any;
    const res = validateUpload(file, 'image');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.status, 413);
  });

  it('accepts valid images', () => {
    const file = { size: 5 * 1024 * 1024, type: 'image/png', name: 'ok.png' } as any;
    const res = validateUpload(file, 'image');
    assert.strictEqual(res.valid, true);
  });

  it('rejects executables', () => {
    const file = { size: 1 * 1024 * 1024, type: 'application/octet-stream', name: 'virus.exe' } as any;
    const res = validateUpload(file, 'archive');
    assert.strictEqual(res.valid, false);
    assert.match(res.error || '', /Executable files are not allowed/);
  });
});

describe('V9: AST SQL Rewriting', () => {
  it('appends LIMIT if not present', () => {
    const res = validateSqlQuery('SELECT * FROM users', 'postgresql');
    assert.strictEqual(res.isValid, true);
    assert.match(res.sanitizedSql || '', /LIMIT 1000/i);
  });

  it('overrides existing LIMIT if too large', () => {
    const res = validateSqlQuery('SELECT * FROM users LIMIT 5000', 'postgresql');
    assert.strictEqual(res.isValid, true);
    assert.match(res.sanitizedSql || '', /LIMIT 1000/i);
  });

  it('fails complex un-parseable queries', () => {
    // If we use invalid syntax to simulate parsing failure
    const res = validateSqlQuery('SELECT * FROM users WHERE; DROP TABLE users', 'postgresql');
    assert.strictEqual(res.isValid, false);
  });
});

describe('V11: Encryption Fallback Removal', () => {
  it('decrypts valid payloads', () => {
    const secret = 'my-super-secret';
    const encrypted = encryptSecret(secret);
    assert.strictEqual(decryptSecret(encrypted), secret);
  });

  it('throws on legacy plaintext instead of returning it', () => {
    const legacy = 'legacy-plaintext-secret';
    assert.throws(() => decryptSecret(legacy), /Failed to decrypt/);
  });
});
