import React, { useEffect, useState } from 'react';
import { SiteConfig } from '../types';

interface Props {
  siteConfig: SiteConfig;
  onComplete: () => void;
}

const SplashScreen: React.FC<Props> = ({ siteConfig, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);
      if (currentStep >= steps) {
        clearInterval(timer);
        setShowText(true);
        setTimeout(onComplete, 1000);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0c10] flex flex-col items-center justify-center">
      <img src={siteConfig.logoUrl} alt="Logo" style={{ width: `${siteConfig.logoWidth || 180}px` }} className="mb-8" />
      <div className="w-48 h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
        <div className="h-full bg-sky-500 transition-all duration-75" style={{ width: `${progress}%` }}></div>
      </div>
      {showText && <h1 className="text-4xl font-black text-white mt-8 animate-pulse">FastPay Trader</h1>}
    </div>
  );
};

export default SplashScreen;
