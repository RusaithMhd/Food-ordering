import { cookies } from 'next/headers';
import { adminAuth } from '../firebase/server';
import { hasAnyRole, Role } from './rbac';
import { logger } from '../logger';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Wraps a server action to ensure the user is authenticated and optionally has required roles.
 */
export function withAuth<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options?: {
    requiredRoles?: Role[];
    requireUser?: boolean;
  }
) {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const cookieStore = await cookies();
    const session = cookieStore.get('__session')?.value;

    if (!session) {
      if (options?.requireUser !== false) {
        throw new UnauthorizedError('Not authenticated');
      }
      return action(...args);
    }

    try {
      // Verify session
      const decodedToken = await adminAuth.verifySessionCookie(session, true);
      const userId = decodedToken.uid;

      // Check RBAC if required
      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        const authorized = await hasAnyRole(userId, options.requiredRoles);
        if (!authorized) {
          logger.warn(`User ${userId} attempted unauthorized action requiring ${options.requiredRoles.join(',')}`);
          throw new UnauthorizedError('Insufficient permissions');
        }
      }

      // Inject userId into the action context (typically by passing it as the last arg,
      // or expecting the action to retrieve it from cookies itself).
      // For simplicity in this architecture, actions will trust the cookie or we can pass it down.
      
      return action(...args);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      logger.error('Session verification failed in withAuth', { error });
      throw new UnauthorizedError('Invalid session');
    }
  };
}
