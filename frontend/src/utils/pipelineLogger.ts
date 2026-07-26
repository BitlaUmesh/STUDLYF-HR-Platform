/**
 * Pipeline Debug Logger
 * ─────────────────────
 * This module provides structured, persistent logging for the Candidate
 * Overview panel. Logs are stored in sessionStorage under key
 * "PIPELINE_LOGS" and printed to the browser console with timestamps.
 *
 * To read logs from the browser console, open DevTools and run:
 *   JSON.parse(sessionStorage.getItem('PIPELINE_LOGS') || '[]')
 */

export interface PipelineLog {
  ts: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  tag: string;
  message: string;
  data?: unknown;
}

const STORAGE_KEY = 'PIPELINE_LOGS';
const MAX_LOGS = 200;

function now(): string {
  return new Date().toISOString();
}

function persist(log: PipelineLog) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const logs: PipelineLog[] = raw ? JSON.parse(raw) : [];
    logs.push(log);
    // Keep the last MAX_LOGS entries
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // sessionStorage unavailable — silently skip persistence
  }
}

export const pipelineLogger = {
  info(tag: string, message: string, data?: unknown) {
    const log: PipelineLog = { ts: now(), level: 'INFO', tag, message, data };
    console.log(`[PIPELINE][${tag}] ${message}`, data ?? '');
    persist(log);
  },

  warn(tag: string, message: string, data?: unknown) {
    const log: PipelineLog = { ts: now(), level: 'WARN', tag, message, data };
    console.warn(`[PIPELINE][${tag}] ${message}`, data ?? '');
    persist(log);
  },

  error(tag: string, message: string, data?: unknown) {
    const log: PipelineLog = { ts: now(), level: 'ERROR', tag, message, data };
    console.error(`[PIPELINE][${tag}] ${message}`, data ?? '');
    persist(log);
  },

  /** Read all stored logs */
  dump(): PipelineLog[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** Clear stored logs */
  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Serialize an Axios / fetch error into a plain object so it can be
   * JSON-stringified into sessionStorage without losing detail.
   */
  serializeError(err: unknown): object {
    if (err == null) return { raw: String(err) };

    const isAxiosError =
      typeof err === 'object' &&
      err !== null &&
      'isAxiosError' in err &&
      (err as any).isAxiosError === true;

    if (isAxiosError) {
      const axiosErr = err as any;
      return {
        type: 'AxiosError',
        message: axiosErr.message,
        code: axiosErr.code,
        status: axiosErr.response?.status,
        statusText: axiosErr.response?.statusText,
        responseData: axiosErr.response?.data,
        requestUrl: axiosErr.config?.url,
        requestBaseURL: axiosErr.config?.baseURL,
        requestMethod: axiosErr.config?.method,
        requestHeaders: axiosErr.config?.headers,
      };
    }

    if (err instanceof Error) {
      return { type: 'Error', name: err.name, message: err.message, stack: err.stack };
    }

    return { type: 'unknown', raw: String(err) };
  },
};

// Expose globally for quick DevTools access
if (typeof window !== 'undefined') {
  (window as any).__pipelineLogs = pipelineLogger;
}
