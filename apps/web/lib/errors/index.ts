import { NextResponse } from 'next/server';

// ─── Error Classes ─────────────────────────────────────────────────────────────

/**
 * Base application error with structured fields.
 * Use this for all known/expected error conditions.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    userMessage: string,
    options?: { cause?: Error; isOperational?: boolean }
  ) {
    super(userMessage, { cause: options?.cause });
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.isOperational = options?.isOperational ?? true;
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, cause?: Error) {
    super(404, `${resource} not found`, { cause });
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: Error) {
    super(400, message, { cause });
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', cause?: Error) {
    super(403, message, { cause });
    this.name = 'ForbiddenError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', cause?: Error) {
    super(429, message, { cause });
    this.name = 'RateLimitError';
  }
}

// ─── Safe Error Response Builder ───────────────────────────────────────────────

/**
 * Converts any error into a safe JSON response.
 * - Known AppErrors: returns the user-facing message and status code.
 * - Unknown errors: returns a generic 500 message, logs the real error server-side.
 * 
 * NEVER leaks stack traces, internal paths, or library error messages to the client.
 */
export function safeErrorResponse(error: unknown, context?: string): NextResponse {
  // Known application errors
  if (error instanceof AppError) {
    if (!error.isOperational) {
      console.error(`[CRITICAL] Non-operational error${context ? ` in ${context}` : ''}:`, error);
    }
    return NextResponse.json(
      { error: error.userMessage },
      { status: error.statusCode }
    );
  }

  // Unknown/unexpected errors — log full details server-side, return generic message
  console.error(
    `[ERROR]${context ? ` ${context}:` : ''}`,
    error instanceof Error ? { message: error.message, stack: error.stack } : error
  );

  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  );
}
