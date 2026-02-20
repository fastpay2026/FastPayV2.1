
import React, { useState } from 'react';
import { SiteConfig } from '../types';

interface Props {
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
}

const SiteIdentity: React.FC<Props> = ({ siteConfig, onUpdateConfig }) => {
  const [tempConfig, setTempConfig] = useState<SiteConfig>(siteConfig);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(tempConfig);
    alert('تم تحديث هوية النظام بنجاح 📡');
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right pb-40">
      <h2 className="text-5xl font-black tracking-tighter">تخصيص هوية النظام</h2>
      <form onSubmit={handleSaveConfig} className="bg-[#0f172a] p-12 rounded-[4rem] border border-white/5 shadow-2xl space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-2xl font-black border-r-8 border-sky-500 pr-6 uppercase tracking-widest">العلامة التجارية</h3>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">رابط الشعار</label><input value={tempConfig.logoUrl} onChange={e => setTempConfig({ ...tempConfig, logoUrl: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">اسم الشبكة</label><input value={tempConfig.siteName} onChange={e => setTempConfig({ ...tempConfig, siteName: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all" /></div>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-black border-r-8 border-emerald-500 pr-6 uppercase tracking-widest">نصوص الواجهة</h3>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">عنوان Hero</label><input value={tempConfig.heroTitle} onChange={e => setTempConfig({ ...tempConfig, heroTitle: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500 transition-all" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">وصف Hero</label><textarea value={tempConfig.heroSubtitle} onChange={e => setTempConfig({ ...tempConfig, heroSubtitle: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none h-32 focus:border-sky-500 transition-all" /></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-white/5">
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">البريد</label><input value={tempConfig.contactEmail} onChange={e => setTempConfig({ ...tempConfig, contactEmail: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">الهاتف</label><input value={tempConfig.contactPhone} onChange={e => setTempConfig({ ...tempConfig, contactPhone: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500" dir="ltr" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase mr-4">العنوان</label><input value={tempConfig.contactAddress} onChange={e => setTempConfig({ ...tempConfig, contactAddress: e.target.value })} className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl font-black outline-none focus:border-sky-500" /></div>
        </div>
        <button type="submit" className="w-full py-10 bg-sky-600 rounded-[4rem] font-black text-3xl shadow-xl hover:bg-sky-500 transition-all">حفظ وتطبيق الهوية التنفيذية 📡</button>
      </form>
    </div>
  );
};

export default SiteIdentity;
