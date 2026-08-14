import { createClient } from '../lib/supabase/browser';
import { logger } from '../lib/logger';

export interface Branch {
  id: string;
  hotel_id: string;
  name: string;
  timezone: string;
  status: 'OPEN' | 'CLOSED' | 'SCHEDULED' | 'TEMPORARILY_PAUSED';
}

export interface Room {
  id: string;
  branch_id: string;
  room_number: string;
  floor: string | null;
  status: string;
}

export const hotelService = {
  /**
   * Fetch all active branches
   */
  async getBranches(): Promise<Branch[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('status', 'OPEN');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch branches', { error });
      return [];
    }
  },

  /**
   * Get specific branch details
   */
  async getBranch(branchId: string): Promise<Branch | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to fetch branch ${branchId}`, { error });
      return null;
    }
  },

  /**
   * Validate if a room exists in a branch
   */
  async validateRoom(branchId: string, roomId: string): Promise<Room | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .eq('branch_id', branchId)
        .eq('status', 'ACTIVE')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to validate room ${roomId} in branch ${branchId}`, { error });
      return null;
    }
  }
};
