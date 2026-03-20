import React, { useState } from 'react';
import { agentLotteryService } from '../../services/agentLotteryService';

export const ManagerLotterySetup: React.FC = () => {
  const [prize, setPrize] = useState('');
  const [winners, setWinners] = useState(1);
  const [time, setTime] = useState('');

  const handleCreate = async () => {
    await agentLotteryService.createPrize({
      prize_description: prize,
      num_winners: winners,
      lottery_time: time,
      is_active: true
    });
    alert('تم إنشاء القرعة بنجاح');
  };

  return (
    <div className="p-8 bg-[#0f172a] rounded-3xl text-white space-y-6">
      <h2 className="text-3xl font-black">إعدادات القرعة (للمدير)</h2>
      <input type="text" placeholder="الجائزة" value={prize} onChange={e => setPrize(e.target.value)} className="w-full p-4 bg-black/40 rounded-2xl border border-white/10" />
      <input type="number" placeholder="عدد الفائزين" value={winners} onChange={e => setWinners(parseInt(e.target.value))} className="w-full p-4 bg-black/40 rounded-2xl border border-white/10" />
      <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="w-full p-4 bg-black/40 rounded-2xl border border-white/10" />
      <button onClick={handleCreate} className="w-full py-4 bg-sky-600 rounded-2xl font-black">إنشاء القرعة</button>
    </div>
  );
};
