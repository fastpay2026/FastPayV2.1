
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SiteConfig, RaffleEntry, RaffleWinner, Notification } from '../../types';
import { useI18n } from '../../i18n/i18n';

interface Props {
  raffleEntries: RaffleEntry[];
  setRaffleEntries: React.Dispatch<React.SetStateAction<RaffleEntry[]>>;
  raffleWinners: RaffleWinner[];
  setRaffleWinners: React.Dispatch<React.SetStateAction<RaffleWinner[]>>;
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
  addNotification: (title: string, message: string, type: Notification['type']) => void;
}

const DrawManager: React.FC<Props> = ({ 
  raffleEntries, setRaffleEntries, raffleWinners, setRaffleWinners, 
  siteConfig, onUpdateConfig, addNotification 
}) => {
  const { t } = useI18n();
  const [isDrawing, setIsDrawing] = useState(false);

  const drawRaffleWinner = () => {
    if (raffleEntries.length === 0) return alert(t('no_participants_warning'));
    const prize = prompt(t('enter_prize_name'), siteConfig.rafflePrizeType || t('grand_prize'));
    if (!prize) return;

    setIsDrawing(true);
    setTimeout(() => {
      const winnerIdx = Math.floor(Math.random() * raffleEntries.length);
      const winner = raffleEntries[winnerIdx];
      
      const winnerData: RaffleWinner = { 
        ...winner, 
        id: uuidv4(),
        wonAt: new Date().toLocaleString(), 
        prizeTitle: prize 
      };

      setRaffleWinners(prev => [winnerData, ...prev]);
      setRaffleEntries(prev => prev.filter((_, i) => i !== winnerIdx));
      setIsDrawing(false);
      
      addNotification(t('winner_announcement'), `${t('winner_is')} ${winner.fullName} - ${t('prize')}: ${prize}`, 'system');
      alert(`${t('congratulations_winner')} ${winner.fullName}\n${t('prize')}: ${prize}`);
    }, 2500);
  };

  return (
    <div className="space-y-10 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-amber-500">{t('monthly_raffle_mgmt')}</h2>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            disabled={isDrawing || raffleEntries.length === 0}
            onClick={drawRaffleWinner} 
            className={`w-full md:w-auto bg-amber-600 px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 ${isDrawing ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:bg-amber-500 hover:scale-105 active:scale-95'}`}
          >
            {isDrawing ? (
              <>
                <span>{t('drawing_in_progress')}</span>
                <span className="animate-spin text-3xl">🌀</span>
              </>
            ) : (
              <>
                <span>{t('draw_random_winner')}</span>
                <span className="text-3xl">✨</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
        <h3 className="text-2xl font-black border-r-8 border-amber-500 pr-6 uppercase tracking-widest">{t('current_raffle_settings')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase mr-4">{t('prize_type')}</label>
            <input 
              value={siteConfig.rafflePrizeType} 
              onChange={e => onUpdateConfig({ ...siteConfig, rafflePrizeType: e.target.value })} 
              className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-amber-500 transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase mr-4">{t('ticket_price')}</label>
            <input 
              type="number"
              value={siteConfig.raffleEntryCost} 
              onChange={e => onUpdateConfig({ ...siteConfig, raffleEntryCost: parseFloat(e.target.value) })} 
              className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-amber-500 transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase mr-4">{t('raffle_date')}</label>
            <input 
              type="datetime-local"
              value={siteConfig.raffleEndDate ? new Date(siteConfig.raffleEndDate).toISOString().slice(0, 16) : ''} 
              onChange={e => onUpdateConfig({ ...siteConfig, raffleEndDate: new Date(e.target.value).toISOString() })} 
              className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-amber-500 transition-all" 
            />
          </div>
          <div className="flex items-center gap-4 pt-6">
            <button 
              onClick={() => onUpdateConfig({ ...siteConfig, showRaffleCountdown: !siteConfig.showRaffleCountdown })}
              className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${siteConfig.showRaffleCountdown ? 'bg-amber-600 text-white' : 'bg-white/5 text-slate-500 border border-white/10'}`}
            >
              {siteConfig.showRaffleCountdown ? t('hide_countdown') : t('show_countdown')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col">
          <h3 className="text-2xl font-black mb-8 border-b border-white/5 pb-4">{t('active_participants')} ({raffleEntries.length})</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
            {raffleEntries.map(e => (
              <div key={e.id} className="flex justify-between items-center p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-sky-500/30 transition-all">
                <div>
                  <p className="font-black text-white text-lg">{e.fullName}</p>
                  <p className="text-xs text-slate-500 font-mono">@{e.username}</p>
                </div>
                <span className="text-sky-400 font-mono text-sm tracking-widest">{e.ticketNumber}</span>
              </div>
            ))}
            {raffleEntries.length === 0 && <p className="text-center opacity-20 py-20 italic">{t('no_participants_yet')}</p>}
          </div>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col">
          <h3 className="text-2xl font-black mb-8 text-emerald-400 border-b border-white/5 pb-4">{t('royal_winners_log')}</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar flex-1">
            {raffleWinners.map(w => (
              <div key={w.id} className="p-8 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex justify-between items-center group relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] text-emerald-400 font-black mb-1 uppercase tracking-[0.3em]">{t('prize')}: {w.prizeTitle}</p>
                  <p className="text-2xl font-black text-white">{w.fullName}</p>
                  <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase">{w.wonAt}</p>
                </div>
                <span className="text-5xl group-hover:scale-125 transition-transform duration-500">👑</span>
              </div>
            ))}
            {raffleWinners.length === 0 && <p className="text-center opacity-20 py-20 italic">{t('waiting_for_first_winner')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawManager;
