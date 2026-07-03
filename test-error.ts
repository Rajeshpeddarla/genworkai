const { ValidationError, safeErrorResponse, AppError } = require('./apps/web/lib/errors/index.ts');

const err = new ValidationError('test');
console.log('Is AppError?', err instanceof AppError);
