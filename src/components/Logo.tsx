import React from 'react';
import { SiteConfig } from '../../types';

interface LogoProps {
  siteConfig: SiteConfig;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = React.memo(({ siteConfig, className, style, onClick }) => {
  const logoUrl = siteConfig.logoUrl || "https://i.postimg.cc/R0FNTSDc/download-1-removebg-preview.png";

  return (
    <div className={`flex flex-col items-center bg-transparent ${className}`} style={{ ...style, backgroundColor: 'transparent' }} onClick={onClick}>
      <img 
        src={logoUrl} 
        alt="Logo" 
        className="w-full h-auto"
        style={{ width: '100%', backgroundColor: 'transparent' }}
        referrerPolicy="no-referrer"
      />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
        Network
      </span>
    </div>
  );
});

export default Logo;
