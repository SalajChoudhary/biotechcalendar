import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (body && typeof body === 'object') {
      const fieldErrors = (body as { fieldErrors?: Record<string, string> }).fieldErrors;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        return Object.entries(fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('; ');
      }
      const message = (body as { message?: string }).message;
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }
    if (error.status === 0) {
      return 'Network error — could not reach the server.';
    }
  }
  return fallback;
}
