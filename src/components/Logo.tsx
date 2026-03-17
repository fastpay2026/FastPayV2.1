import React from 'react';
import { SiteConfig } from '../../types';

interface LogoProps {
  siteConfig: SiteConfig;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ siteConfig, className, style, onClick }) => {
  if (!siteConfig.logoUrl) return null;

  return (
    <div className={`flex flex-col items-center ${className}`} style={style} onClick={onClick}>
      <img 
        src={siteConfig.logoUrl} 
        alt="Logo" 
        className="w-full h-auto"
        style={{ width: '100%' }}
        referrerPolicy="no-referrer"
      />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
        Network
      </span>
    </div>
  );
};

export default Logo;
