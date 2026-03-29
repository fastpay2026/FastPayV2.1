
import React, { useState } from 'react';
import { User, RechargeCard } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  rechargeCards: RechargeCard[];
  setRechargeCards: React.Dispatch<React.SetStateAction<RechargeCard[]>>;
  user: User;
}

const CardGenerator: React.FC<Props> = ({ rechargeCards, setRechargeCards, user }) => {
  const { t } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({ amount: 100, quantity: 10 });

  const generateCards = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: RechargeCard[] = Array.from({ length: cardForm.quantity }, () => ({
      code: `FP-${Math.random().toString(36).substr(2, 6).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      amount: cardForm.amount,
      isUsed: false,
      generatedBy: user.id,
      createdAt: new Date().toISOString()
    }));
    setRechargeCards(prev => [...prev, ...newBatch]);
    setIsModalOpen(false);
    alert(t('cards_generated_success'));
  };

  return (
    <div className="space-y-10 animate-in zoom-in">
      <div className="flex justify-between items-center">
        <h2 className="text-5xl font-black tracking-tighter">{t('generate_recharge_cards')}</h2>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-emerald-500 transition-all">{t('generate_new_cards')}</button>
      </div>
      <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-right font-mono">
          <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black">
            <tr><th className="p-8">{t('unique_code')}</th><th className="p-8 text-center">{t('monetary_value')}</th><th className="p-8 text-center">{t('status')}</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-lg font-black">
            {rechargeCards.slice().reverse().slice(0, 50).map((c, i) => (
              <tr key={i} className="hover:bg-white/5 group transition-all">
                <td className="p-8 text-sky-400 tracking-widest group-hover:text-white transition-colors">{c.code}</td>
              <td className="p-8 text-center text-white font-mono">${c.amount?.toLocaleString()}</td>
                <td className="p-8 text-center">
                  {c.isUsed ? (
                    <span className="text-red-500 bg-red-500/10 px-4 py-1 rounded-full text-[10px] font-black uppercase">{t('used')}</span>
                  ) : (
                    <span className="text-emerald-500 bg-emerald-500/10 px-4 py-1 rounded-full text-[10px] font-black uppercase">{t('active')}</span>
                  )}
                </td>
              </tr>
            ))}
            {rechargeCards.length === 0 && <tr><td colSpan={3} className="p-24 text-center opacity-20 italic text-2xl font-black">{t('no_cards_issued')}</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <form onSubmit={generateCards} className="bg-[#0f172a] border border-white/10 w-full max-w-xl rounded-[4rem] p-16 space-y-12 animate-in zoom-in text-center shadow-3xl">
            <h3 className="text-4xl font-black text-white tracking-tighter">{t('generate_recharge_cards')}</h3>
            <div className="space-y-8 text-right">
              <div className="space-y-2"><label className="text-xs font-black text-slate-500 mr-8 uppercase">{t('card_value')}</label><input type="number" required value={cardForm.amount} onChange={e => setCardForm({ ...cardForm, amount: parseInt(e.target.value) })} className="w-full p-8 bg-black/40 border border-white/10 rounded-[2.5rem] font-black text-center text-5xl text-sky-400 outline-none" /></div>
              <div className="space-y-2"><label className="text-xs font-black text-slate-500 mr-8 uppercase">{t('quantity')}</label><input type="number" required value={cardForm.quantity} onChange={e => setCardForm({ ...cardForm, quantity: parseInt(e.target.value) })} className="w-full p-6 bg-black/40 border border-white/10 rounded-[2rem] font-black text-center text-3xl text-white outline-none" /></div>
            </div>
            <button type="submit" className="w-full py-10 bg-emerald-600 rounded-[4rem] font-black text-3xl shadow-3xl hover:bg-emerald-500 transition-all active:scale-95">{t('start_generation')}</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 font-bold hover:text-white transition-colors">{t('close')}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CardGenerator;
