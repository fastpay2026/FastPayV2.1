import React from 'react';
import { SiteConfig } from '../types';

interface LogoProps {
  siteConfig: SiteConfig;
  className?: string;
  style?: React.CSSProperties;
}

const Logo: React.FC<LogoProps> = ({ siteConfig, className, style }) => {
  return (
    <img 
      src={siteConfig.logoUrl} 
      alt={siteConfig.siteName} 
      className={className} 
      style={style}
      referrerPolicy="no-referrer"
    />
  );
};

export default Logo;
