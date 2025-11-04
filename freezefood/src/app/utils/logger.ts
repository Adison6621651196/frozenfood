export const debug = (...args: any[]) => {
  if ((window as any).FF_LOG_LEVEL === 'debug') console.debug('[DEBUG]', ...args);
};

export const info = (...args: any[]) => {
  console.log('[INFO]', ...args);
};

export const warn = (...args: any[]) => {
  console.warn('[WARN]', ...args);
};

export const error = (...args: any[]) => {
  console.error('[ERROR]', ...args);
};

export default { debug, info, warn, error };
