type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  [key: string]: any;
}

class Logger {
  private log(level: LogLevel, message: string, payload?: LogPayload) {
    const timestamp = new Date().toISOString();
    let data = '';
    try {
      data = payload ? JSON.stringify(payload) : '';
    } catch (e) {
      data = '[Circular or Non-Stringifiable Payload]';
    }
    // In production, you would send this to a service like Datadog, Sentry, etc.
    if (process.env.NODE_ENV === 'production') {
      // Send to remote logger
      console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, payload || '');
    } else {
      // Pretty print in development
      console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, payload || '');
    }
  }

  info(message: string, payload?: LogPayload) {
    this.log('info', message, payload);
  }

  warn(message: string, payload?: LogPayload) {
    this.log('warn', message, payload);
  }

  error(message: string, payload?: LogPayload) {
    this.log('error', message, payload);
  }

  debug(message: string, payload?: LogPayload) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, payload);
    }
  }
}

export const logger = new Logger();
