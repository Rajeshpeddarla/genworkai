export const UPLOAD_LIMITS = {
  image: 20 * 1024 * 1024, // 20MB
  document: 50 * 1024 * 1024, // 50MB
  archive: 100 * 1024 * 1024, // 100MB
};

export const ALLOWED_MIME_TYPES = {
  image: new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  document: new Set([
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown'
  ]),
  archive: new Set([
    'application/zip',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/x-compressed'
  ]),
};

export function validateUpload(file: File, type: 'image' | 'document' | 'archive'): { valid: boolean; error?: string; status?: number } {
  if (!file) {
    return { valid: false, error: 'File is required', status: 400 };
  }

  const limit = UPLOAD_LIMITS[type];
  if (file.size > limit) {
    return { valid: false, error: `File size exceeds the ${limit / (1024 * 1024)}MB limit`, status: 413 };
  }

  const allowedTypes = ALLOWED_MIME_TYPES[type];
  if (!allowedTypes.has(file.type) && file.type !== '') {
    // If it's an archive but has an empty mime type due to OS quirks, we might want to check extension, but for strictly typed ones we enforce mime
    if (type !== 'archive' || (!file.name.toLowerCase().endsWith('.zip'))) {
      return { valid: false, error: `Unsupported file type: ${file.type || 'unknown'}`, status: 415 };
    }
  }

  // Prevent executables entirely
  const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.ps1', '.vbs', '.js', '.jar'];
  const ext = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
  if (dangerousExtensions.includes(`.${ext}`)) {
    return { valid: false, error: 'Executable files are not allowed', status: 415 };
  }

  return { valid: true };
}
