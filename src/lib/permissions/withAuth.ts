import { createClient } from '../supabase/server';
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
    try {
      const supabase = await createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        if (options?.requireUser !== false) {
          throw new UnauthorizedError('Not authenticated');
        }
        return action(...args);
      }

      const userId = user.id;

      // Check RBAC if required
      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        const authorized = await hasAnyRole(userId, options.requiredRoles);
        if (!authorized) {
          logger.warn(`User ${userId} attempted unauthorized action requiring ${options.requiredRoles.join(',')}`);
          throw new UnauthorizedError('Insufficient permissions');
        }
      }

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
