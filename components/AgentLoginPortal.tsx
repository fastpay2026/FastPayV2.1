
import React, { useState } from 'react';
import { User, Role } from '../types';
import { useI18n } from '../i18n/i18n';
import Logo from './Logo';

interface Props {
  onLogin: (user: User) => void;
  accounts: User[];
  siteConfig: any;
}

const AgentLoginPortal: React.FC<Props> = ({ onLogin, accounts, siteConfig }) => {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = accounts.find(
      (acc) => acc.username.toLowerCase() === username.toLowerCase() && 
               acc.password === password && 
               acc.role === 'AGENT'
    );

    if (user) {
      onLogin(user);
    } else {
      setError(t('invalid_credentials'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Logo siteConfig={siteConfig} className="mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white">{t('agent_portal_login')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="text" 
            placeholder={t('username_label')} 
            value={username} 
            onChange={e => setUsername(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-sky-500"
          />
          <input 
            type="password" 
            placeholder={t('password_label')} 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-sky-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-4 bg-sky-600 rounded-2xl text-white font-black hover:bg-sky-500 transition-all">
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentLoginPortal;
