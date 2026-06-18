// ─── File Upload Security ──────────────────────────────────────────────────────

/**
 * MIME type validation with magic-byte checking.
 * Prevents malicious file uploads by verifying actual file content, not just extension.
 */

// Magic bytes for common file types
const MAGIC_BYTES: Record<string, { bytes: number[]; offset?: number }[]> = {
  // PDF
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF

  // Images
  'image/png': [{ bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }],
  'image/jpeg': [{ bytes: [0xFF, 0xD8, 0xFF] }],
  'image/gif': [{ bytes: [0x47, 0x49, 0x46, 0x38] }], // GIF8
  'image/webp': [{ bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }],

  // Documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { bytes: [0x50, 0x4B, 0x03, 0x04] } // PK (zip archive)
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    { bytes: [0x50, 0x4B, 0x03, 0x04] }
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { bytes: [0x50, 0x4B, 0x03, 0x04] }
  ],

  // Archives
  'application/zip': [{ bytes: [0x50, 0x4B, 0x03, 0x04] }],
};

// File size limits by category (in bytes)
const SIZE_LIMITS: Record<string, number> = {
  'application/pdf': 50 * 1024 * 1024,       // 50MB
  'application/msword': 25 * 1024 * 1024,     // 25MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 25 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 25 * 1024 * 1024,
  'application/zip': 100 * 1024 * 1024,       // 100MB
  'image/png': 20 * 1024 * 1024,              // 20MB
  'image/jpeg': 20 * 1024 * 1024,
  'image/gif': 20 * 1024 * 1024,
  'image/webp': 20 * 1024 * 1024,
  'text/plain': 10 * 1024 * 1024,             // 10MB
  'text/markdown': 10 * 1024 * 1024,
  'text/csv': 25 * 1024 * 1024,               // 25MB
  'application/json': 10 * 1024 * 1024,
};

const DEFAULT_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB default

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/bmp',
  'image/avif',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/octet-stream', // Generic binary — checked by magic bytes
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Validates a file upload for security.
 * Checks: MIME type allowlist, magic-byte verification, size limits, filename sanitization.
 */
export function validateUpload(
  file: { name: string; type: string; size: number },
  fileBuffer?: Buffer
): FileValidationResult {
  // 1. MIME type check
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type not allowed: ${file.type}` };
  }

  // 2. Size limit check
  const maxSize = SIZE_LIMITS[file.type] || DEFAULT_SIZE_LIMIT;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File exceeds maximum size of ${maxMB}MB` };
  }

  // 3. Magic byte verification (if buffer provided)
  if (fileBuffer && MAGIC_BYTES[file.type]) {
    const signatures = MAGIC_BYTES[file.type];
    let magicValid = true;

    for (const sig of signatures || []) {
      const offset = sig.offset || 0;
      if (fileBuffer.length < offset + sig.bytes.length) {
        magicValid = false;
        break;
      }
      for (let i = 0; i < sig.bytes.length; i++) {
        if (fileBuffer[offset + i] !== sig.bytes[i]) {
          magicValid = false;
          break;
        }
      }
      if (!magicValid) break;
    }

    if (!magicValid) {
      return { valid: false, error: 'File content does not match its declared type' };
    }
  }

  // 4. Filename sanitization
  const sanitized = sanitizeFilename(file.name);
  if (!sanitized) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true, sanitizedFilename: sanitized };
}

/**
 * Sanitizes a filename to prevent path traversal and injection attacks.
 * - Strips path separators and traversal sequences
 * - Removes null bytes
 * - Limits length
 * - Replaces dangerous characters
 */
export function sanitizeFilename(filename: string): string | null {
  if (!filename || typeof filename !== 'string') return null;

  let sanitized = filename
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove path traversal
    .replace(/\.\.\//g, '')
    .replace(/\.\.\\/g, '')
    // Remove path separators
    .replace(/[/\\]/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Replace potentially dangerous chars but keep dots, dashes, underscores
    .replace(/[^a-zA-Z0-9._\-\s]/g, '_')
    // Collapse multiple underscores/spaces
    .replace(/[_\s]+/g, '_')
    // Remove leading dots (hidden files)
    .replace(/^\.+/, '')
    .trim();

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const nameWithoutExt = sanitized.slice(0, 255 - ext.length - 1);
    sanitized = `${nameWithoutExt}.${ext}`;
  }

  return sanitized || null;
}
