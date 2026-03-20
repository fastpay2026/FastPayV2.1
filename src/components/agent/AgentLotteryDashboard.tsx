import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { agentLotteryService, LotteryPrize, LotteryWinner } from '../../services/agentLotteryService';

interface Props {
  user: User;
}

export const AgentLotteryDashboard: React.FC<Props> = ({ user }) => {
  const [prizes, setPrizes] = useState<LotteryPrize[]>([]);
  const [winners, setWinners] = useState<LotteryWinner[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const activePrizes = await agentLotteryService.getActivePrizes();
      setPrizes(activePrizes);
      const agentWinners = await agentLotteryService.getWinners(user.id);
      setWinners(agentWinners);
    };
    fetchData();
  }, [user.id]);

  return (
    <div className="p-8 bg-[#0f172a] rounded-3xl text-white">
      <h2 className="text-3xl font-black mb-8">نظام قرعة الوكيل</h2>
      <div className="space-y-6">
        {prizes.map(prize => (
          <div key={prize.id} className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold">{prize.prize_description}</h3>
            <p>عدد الفائزين: {prize.num_winners}</p>
            <p>وقت القرعة: {new Date(prize.lottery_time).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
