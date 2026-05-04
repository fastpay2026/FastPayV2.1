import React from 'react';
import { SiteConfig } from '../types';

interface LogoProps {
  siteConfig: SiteConfig;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ siteConfig, className, style, onClick }) => {
  return (
    <img 
      src={siteConfig.logoUrl} 
      alt={siteConfig.siteName} 
      className={className} 
      style={style}
      onClick={onClick}
      referrerPolicy="no-referrer"
    />
  );
};

export default Logo;
