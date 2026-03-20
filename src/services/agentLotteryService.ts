import { supabase } from '../../supabaseClient';

export interface LotteryPrize {
  id: string;
  prize_description: string;
  num_winners: number;
  lottery_time: string;
  is_active: boolean;
}

export interface LotteryWinner {
  id: string;
  prize_id: string;
  agent_id: string;
  winner_user_id: string;
  won_at: string;
}

export const agentLotteryService = {
  async getActivePrizes(): Promise<LotteryPrize[]> {
    const { data, error } = await supabase
      .from('agent_lottery_prizes')
      .select('*')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  },

  async getWinners(agentId: string): Promise<LotteryWinner[]> {
    const { data, error } = await supabase
      .from('agent_lottery_winners')
      .select('*')
      .eq('agent_id', agentId);
    if (error) throw error;
    return data || [];
  },

  async createPrize(prize: Omit<LotteryPrize, 'id'>) {
    const { data, error } = await supabase
      .from('agent_lottery_prizes')
      .insert([prize]);
    if (error) throw error;
    return data;
  },

  async getReferredUsersCount(agentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', agentId);
    if (error) throw error;
    return count || 0;
  }
};
