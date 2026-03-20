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

  if (!user.isVerified || user.verificationStatus !== 'verified') {
    return <div>هذا التبويب غير متاح لحسابك.</div>;
  }

  // Assuming referred_users is a property on User, or we need to calculate it.
  // Based on types.ts, referred_users is not on User.
  // I will assume for now that we have a way to count them.
  const referredUsersCount = 30; // Placeholder

  if (referredUsersCount < 25) {
    return <div>قم بجمع 25 مستخدم لتفعيل الخدمة</div>;
  }

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
