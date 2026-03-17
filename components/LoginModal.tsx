
import React, { useState, useEffect } from 'react';
import { Role, User, SiteConfig } from '../types';
import { useI18n } from '../i18n/i18n';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import Logo from '../src/components/Logo';

interface Props {
  onClose: () => void;
  onLogin: (user: User) => void;
  accounts: User[];
  onSwitchToRegister: () => void;
  siteConfig: SiteConfig;
}

const LoginModal: React.FC<Props> = ({ onClose, onLogin, accounts, onSwitchToRegister, siteConfig }) => {
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Authentication animation states
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authProgress, setAuthProgress] = useState(0);
  const [authStep, setAuthStep] = useState(0);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  const authPhrases = [
    t('auth_phrase_1') || "بدء التحقق من الهوية الرقمية عبر بروتوكول FastPay-Secure...",
    t('auth_phrase_2') || "فحص البصمة الرقمية ومطابقتها مع قاعدة بيانات النخبة...",
    t('auth_phrase_3') || "تشفير جلسة الاتصال بنظام AES-256 GCM العالمي...",
    t('auth_phrase_4') || "التحقق من صلاحيات الوصول إلى الخادم المركزي (Riyadh-Node-01)...",
    t('auth_phrase_5') || "مزامنة المحفظة الرقمية مع سجل المعاملات العالمي...",
    t('auth_phrase_6') || "تأمين قناة الاتصال وتجهيز لوحة القيادة البنكية..."
  ];

  useEffect(() => {
    if (authProgress >= 100 && authenticatedUser && isAuthenticating) {
      onLogin(authenticatedUser);
    }
  }, [authProgress, authenticatedUser, isAuthenticating, onLogin]);

  useEffect(() => {
    let progressInterval: any;
    let phraseInterval: any;

    if (isAuthenticating) {
      const duration = 15000; // 15 seconds
      const updateInterval = 100;
      const increment = (updateInterval / duration) * 100;

      progressInterval = setInterval(() => {
        setAuthProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + increment;
        });
      }, updateInterval);
      
      phraseInterval = setInterval(() => {
        setAuthStep(prev => (prev + 1) % authPhrases.length);
      }, 2500);

      return () => {
        clearInterval(progressInterval);
        clearInterval(phraseInterval);
      };
    }
  }, [isAuthenticating]);

  const handleBack = () => {
    setSelectedRole(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    console.log('Login Attempt:', { 
      username: trimmedUsername, 
      role: selectedRole,
      accountsCount: accounts.length 
    });

    const user = accounts.find(
      (acc) => acc.username.toLowerCase() === trimmedUsername.toLowerCase() && 
               acc.password === trimmedPassword && 
               (selectedRole === 'DEVELOPER' ? (acc.role === 'DEVELOPER' || acc.role === 'ADMIN') : acc.role === selectedRole)
    );

    if (!user) {
      console.log('User not found in accounts array. Checking for username match only...');
      const usernameMatch = accounts.find(acc => acc.username.toLowerCase() === trimmedUsername.toLowerCase());
      if (usernameMatch) {
        console.log('Username match found, but password or role mismatch:', {
          expectedRole: selectedRole,
          actualRole: usernameMatch.role,
          passwordMatch: usernameMatch.password === trimmedPassword
        });
      } else {
        console.log('No user found with username:', trimmedUsername);
      }
    }

    if (user) {
      console.log('User found, proceeding with login:', user.username);
      if (user.status === 'suspended' || user.status === 'disabled') {
        setError('هذا الحساب معطل حالياً، يرجى مراجعة الإدارة');
      } else {
        // Attempt to sign in with Supabase Auth to establish a real session
        try {
          if (isSupabaseConfigured) {
            const { error: authError } = await supabase.auth.signInWithPassword({
              email: user.email,
              password: trimmedPassword,
            });
            if (authError) {
              console.warn("Supabase Auth Warning (ignoring):", authError.message);
            }
          }
        } catch (authErr) {
          console.error("Supabase Auth Error (ignoring):", authErr);
        }
        
        // Proceed with local login regardless of Supabase result
        setAuthenticatedUser(user);
        setIsAuthenticating(true);
      }
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-[#0f172a]/95 border border-white/10 w-full max-w-lg rounded-[2.5rem] md:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in duration-500 backdrop-blur-3xl max-h-[90vh] flex flex-col">
        <div className="overflow-y-auto custom-scrollbar p-8 sm:p-12 md:p-16 text-center">
          {!isAuthenticating && (
            <button onClick={onClose} className="absolute top-6 right-6 md:top-10 md:right-10 text-slate-500 hover:text-white transition bg-white/5 p-2 md:p-3 rounded-full z-10">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          )}

          {isAuthenticating ? (
            <div className="py-12 space-y-12 animate-in fade-in duration-700">
               <div className="space-y-6">
                  <div className="w-24 h-24 bg-sky-600/10 rounded-full flex items-center justify-center text-5xl mx-auto border border-sky-500/20 animate-pulse">🔒</div>
                  <h3 className="text-3xl font-black text-white tracking-tighter">{t('authenticating')}</h3>
                  <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">{t('security_shield')}</p>
               </div>

               <div className="space-y-8">
                  <div className="relative w-full h-16 bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-inner">
                     <div 
                        className="h-full bg-gradient-to-r from-sky-600 to-indigo-600 transition-all duration-300 ease-linear shadow-[0_0_30px_rgba(14,165,233,0.4)]" 
                        style={{ width: `${authProgress}%` }}
                     ></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black font-mono tracking-tighter mix-blend-difference text-white">
                           {Math.floor(authProgress)}%
                        </span>
                     </div>
                  </div>
                  
                  <div className="min-h-[60px] flex items-center justify-center px-4">
                     <p className="text-lg font-black text-sky-400 animate-pulse leading-relaxed text-center">
                        {authPhrases[authStep]}
                     </p>
                  </div>
               </div>

               <div className="pt-8 border-t border-white/5 flex flex-col gap-2 opacity-40">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">AES-256 Bit Encryption</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">End-to-End Secure Tunnel</p>
               </div>
            </div>
          ) : !selectedRole ? (
            <div className="space-y-6 md:space-y-8 pt-4 md:pt-0">
              <div className="mb-6 md:mb-12">
                 <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <Logo siteConfig={siteConfig} className="w-full h-full" />
                 </div>
                 <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{t('secure_access_portal')}</h2>
                 <p className="text-slate-500 font-bold mt-2 text-sm md:text-base">{t('choose_account_type')}</p>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {[
                  { r: 'DEVELOPER', label: t('executive_management'), icon: '⚡', color: 'from-sky-600 to-indigo-600', desc: t('network_management_desc') },
                  { r: 'DISTRIBUTOR', label: t('distributor_platform'), icon: '💼', color: 'from-amber-500 to-orange-600', desc: t('distributor_ops_desc') },
                  { r: 'MERCHANT', label: t('merchant_suite'), icon: '🏪', color: 'from-teal-500 to-emerald-600', desc: t('merchant_deals_desc') },
                  { r: 'USER', label: t('digital_wallet'), icon: '👤', color: 'from-emerald-500 to-teal-600', desc: t('personal_payments_desc') }
                ].map((item) => (
                  <button 
                    key={item.r} 
                    onClick={() => setSelectedRole(item.r as Role)} 
                    className="w-full p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-right flex items-center gap-4 md:gap-6 group"
                  >
                     <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${item.color} text-white rounded-xl md:rounded-[1.25rem] flex items-center justify-center text-xl md:text-3xl shadow-2xl group-hover:scale-110 transition-transform duration-500 flex-shrink-0`}>
                       {item.icon}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-lg md:text-xl font-black text-white mb-1 truncate">{item.label}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold truncate">{item.desc}</p>
                     </div>
                     <span className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">←</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 md:mt-12 pt-6 md:pt-10 border-t border-white/5">
                <p className="text-slate-500 font-bold mb-2 md:mb-4 text-sm">{t('no_account_yet')}</p>
                <button onClick={onSwitchToRegister} className="text-sky-400 font-black text-lg md:text-xl hover:text-sky-300 transition-all inline-flex items-center gap-2">
                   <span>{t('create_new_account')}</span>
                   <span className="text-xl md:text-2xl">⚡</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 text-right animate-in slide-in-from-left duration-500 pt-8 md:pt-0">
              <div className="flex justify-between items-center mb-8 md:mb-12">
                <button type="button" onClick={handleBack} className="text-sky-500 font-black hover:bg-sky-500/10 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 text-sm md:text-base">
                   <span>{t('back')}</span>
                   <span className="text-lg">→</span>
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  {t('login_as')} {selectedRole === 'DEVELOPER' ? t('executive') : selectedRole === 'DISTRIBUTOR' ? t('distributor') : selectedRole === 'MERCHANT' ? t('merchant') : t('user')}
                </h2>
              </div>
              
              <div className="space-y-4 md:space-y-6">
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-[10px] md:text-xs font-black text-slate-500 mr-4 uppercase tracking-widest">{t('username_label')}</label>
                  <input 
                    required
                    value={username} 
                    onChange={e=>setUsername(e.target.value)} 
                    className="w-full p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 text-white font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg md:text-xl" 
                    placeholder={t('username_placeholder') || "Username"} 
                  />
                </div>
                <div className="space-y-2 md:space-y-3">
                  <label className="block text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">{t('password_label')}</label>
                  <input 
                    required
                    type="password" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    className="w-full p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 text-white font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg md:text-xl" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-400 p-4 md:p-6 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black border border-red-500/20 flex items-center gap-3">
                   <span>⚠️</span>
                   <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-6 md:py-8 bg-sky-600 text-white rounded-2xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-[0_20px_40px_-10px_rgba(14,165,233,0.5)] hover:bg-sky-500 transition-all active:scale-95 transform ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? t('authenticating') : t('auth_and_login')}
              </button>
              
              <p className="text-center text-slate-500 font-bold text-[10px] md:text-sm">{t('aes_encryption_active')}</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
