import { errorLogApi } from '@/db/api';
import type { ErrorType, ErrorSeverity } from '@/types/types';

/**
 * Utility function to log errors to the database
 */
export const logError = async (
  error: Error | string,
  options?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    metadata?: Record<string, unknown>;
  }
) => {
  try {
    const message = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? undefined : error.stack;

    await errorLogApi.createErrorLog({
      error_type: options?.type || 'frontend',
      severity: options?.severity || 'medium',
      message,
      stack_trace: stackTrace,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      metadata: options?.metadata,
    });
  } catch (err) {
    // Silently fail to avoid infinite error loops
    console.error('Failed to log error:', err);
  }
};

/**
 * Log API errors
 */
export const logApiError = async (
  error: Error | string,
  endpoint?: string,
  severity: ErrorSeverity = 'high'
) => {
  await logError(error, {
    type: 'api',
    severity,
    metadata: { endpoint },
  });
};

/**
 * Log authentication errors
 */
export const logAuthError = async (
  error: Error | string,
  action?: string,
  severity: ErrorSeverity = 'high'
) => {
  await logError(error, {
    type: 'auth',
    severity,
    metadata: { action },
  });
};

/**
 * Log database errors
 */
export const logDatabaseError = async (
  error: Error | string,
  query?: string,
  severity: ErrorSeverity = 'critical'
) => {
  await logError(error, {
    type: 'database',
    severity,
    metadata: { query },
  });
};

/**
 * Log user action errors
 */
export const logUserActionError = async (
  error: Error | string,
  action?: string,
  severity: ErrorSeverity = 'low'
) => {
  await logError(error, {
    type: 'user_action',
    severity,
    metadata: { action },
  });
};

/**
 * Log system errors
 */
export const logSystemError = async (
  error: Error | string,
  component?: string,
  severity: ErrorSeverity = 'critical'
) => {
  await logError(error, {
    type: 'system',
    severity,
    metadata: { component },
  });
};
