import { HttpErrorResponse } from '@angular/common/http';

/**
 * The backend answers validation errors with {"error": ...} and other HTTP
 * errors with {"message": ...}; fall back to a generic text otherwise.
 */
export function serverErrorMessage(err: HttpErrorResponse | undefined, fallback: string): string {
  const body = err?.error;
  const text = body && typeof body === 'object' ? (body.error ?? body.message) : undefined;
  return typeof text === 'string' && text.trim() !== '' ? text : fallback;
}
