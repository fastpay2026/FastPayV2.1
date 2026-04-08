
import React from 'react';
import { useI18n } from '../i18n/i18n';

const UnderDevelopment: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center p-12 md:p-24 space-y-8 animate-in fade-in zoom-in duration-700 text-center">
      <div className="w-32 h-32 md:w-48 md:h-48 bg-amber-500/10 rounded-full flex items-center justify-center text-6xl md:text-8xl animate-pulse border border-amber-500/20">
        🛠️
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
          {t('service_under_development')}
        </h2>
        <p className="text-slate-500 font-bold text-lg md:text-xl max-w-2xl mx-auto">
          We are currently updating and improving this service to provide the best possible experience. Please check back later.
        </p>
      </div>
      <div className="flex gap-4 text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] opacity-50">
        <span>Maintenance Mode</span>
        <span>•</span>
        <span>System Update</span>
        <span>•</span>
        <span>FastFlow Network</span>
      </div>
    </div>
  );
};

export default UnderDevelopment;
