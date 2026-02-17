
import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  onClose: () => void;
  onRegister: (newUser: User) => void;
  onSwitchToLogin: () => void;
  accounts: User[];
}

const RegisterModal: React.FC<Props> = ({ onClose, onRegister, onSwitchToLogin, accounts }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.fullName.trim().split(' ').length < 3) {
      return setError('يرجى إدخال الاسم الثلاثي بالكامل');
    }

    if (formData.username.trim().length < 4) {
      return setError('اسم المستخدم يجب أن يتكون من 4 أحرف على الأقل');
    }

    // Duplicate Username Check
    const isDuplicate = accounts.some(
      (acc) => acc.username.toLowerCase() === formData.username.trim().toLowerCase()
    );
    if (isDuplicate) {
      return setError('عذراً، اسم المستخدم هذا محجوز مسبقاً، يرجى اختيار اسم آخر');
    }

    if (!validateEmail(formData.email)) {
      return setError('يرجى إدخال بريد إلكتروني صحيح');
    }

    if (formData.password.length < 6) {
      return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('كلمتا المرور غير متطابقتين');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: formData.username.trim(),
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      role: 'USER',
      balance: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    onRegister(newUser);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative bg-[#0f172a]/95 border border-white/10 w-full max-w-2xl rounded-[3rem] md:rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in duration-500 backdrop-blur-3xl max-h-[90vh] flex flex-col">
        <div className="overflow-y-auto custom-scrollbar p-8 md:p-16 text-center">
          <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition bg-white/5 p-3 rounded-full z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div className="mb-12">
            <div className="w-20 h-20 bg-sky-600/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-sky-500/30">
              <span className="text-4xl">✨</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">انضم للمستقبل المالي</h2>
            <p className="text-slate-500 font-bold mt-2">عضوية FastPay Network الرقمية الفاخرة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">الاسم الثلاثي الكامل</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="الاسم الثلاثي"
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-sky-400 font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg placeholder:text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">اسم المستخدم (Unique ID)</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Username"
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-sky-400 font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg placeholder:text-slate-700"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">البريد الإلكتروني الموثق</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@domain.com"
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-sky-400 font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg placeholder:text-slate-700"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">رقم الهاتف (التحقق الدولي)</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="+966 5X XXX XXXX"
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-sky-400 font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg placeholder:text-slate-700"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">كلمة المرور المشفرة</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-sky-400 font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 mr-4 uppercase tracking-widest">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-sky-400 font-black outline-none focus:border-sky-500 focus:bg-sky-500/5 transition-all text-lg"
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-500/10 text-red-400 p-5 rounded-3xl text-sm font-black border border-red-500/20 flex items-center gap-3 animate-shake">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            <button 
              type="submit"
              className="w-full py-7 bg-sky-600 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_20px_50px_-10px_rgba(14,165,233,0.5)] hover:bg-sky-500 transition-all active:scale-95 transform mt-4"
            >
              تأسيس العضوية الرقمية
            </button>

            <div className="mt-10 pt-8 border-t border-white/5">
               <p className="text-slate-500 font-bold">لديك حساب مفعل مسبقاً؟ <button onClick={onSwitchToLogin} type="button" className="text-sky-400 font-black hover:text-sky-300 transition-all">سجل دخولك من هنا</button></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
