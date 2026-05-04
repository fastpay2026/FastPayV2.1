import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CustomPage } from '../../types';
import { supabaseService } from '../../supabaseService';

interface Props {
  pages: CustomPage[];
  setPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
}

const LegalManagementPage: React.FC<Props> = ({ pages, setPages }) => {
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [content, setContent] = useState('');

  const targetSlugs = ['terms-of-service', 'privacy-policy', 'security-standards', 'global-licenses'];
  const legalPages = pages.filter(p => targetSlugs.includes(p.slug));
  const languages = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' }
  ];
  const [selectedLang, setSelectedLang] = useState('ar');

  useEffect(() => {
    if (selectedPage) {
      try {
        const parsed = JSON.parse(selectedPage.content);
        setContent(parsed[selectedLang] || '');
      } catch (e) {
        setContent(selectedPage.content); // Fallback if string
      }
    }
  }, [selectedPage, selectedLang]);

  const handleSave = async () => {
    if (!selectedPage) return;
    
    let contentObj: any = {};
    try {
      contentObj = JSON.parse(selectedPage.content);
    } catch (e) {
      // If it was a plain string, keep it as 'ar' or default
      contentObj = { ar: selectedPage.content };
    }
    contentObj[selectedLang] = content;

    const updatedPage = { ...selectedPage, content: JSON.stringify(contentObj) };
    try {
      await supabaseService.upsertCustomPage(updatedPage);
      setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
      alert('✅ تم حفظ التعديلات بنجاح!');
    } catch (e) {
      alert('❌ حدث خطأ أثناء الحفظ.');
    }
  };

  return (
    <div className="p-8 bg-[#161a1e] rounded-[2.5rem] border border-white/5 space-y-10 shadow-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white flex items-center gap-4">
          <span className="p-3 bg-sky-500/10 rounded-2xl text-sky-500 text-2xl">⚖️</span>
          إدارة الاتفاقيات القانونية
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {targetSlugs.map(slug => {
          const page = legalPages.find(p => p.slug === slug);
          if (!page) return null;
          return (
            <button
              key={page.id}
              onClick={() => { setSelectedPage(page); }}
              className={`p-6 rounded-3xl border transition-all duration-500 flex flex-col gap-3 group ${selectedPage?.id === page.id ? 'bg-sky-600 border-sky-500 shadow-2xl scale-105' : 'bg-[#0a0c10] border-white/5 hover:border-white/20'}`}
            >
              <span className={`text-xs font-black uppercase tracking-widest ${selectedPage?.id === page.id ? 'text-white/60' : 'text-slate-500'}`}>Legal Doc</span>
              <span className="font-black text-lg">{page.title}</span>
            </button>
          );
        })}
      </div>

      {selectedPage ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#0a0c10] p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-6">
             <div className="flex gap-2 p-2 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all duration-300 ${selectedLang === lang.code ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleSave}
              className="px-10 py-4 bg-sky-600 text-white font-black rounded-2xl hover:bg-sky-500 transition-all shadow-xl hover:shadow-sky-500/25 flex items-center gap-3 active:scale-95"
            >
              <span>💾</span>
              <span>حفظ المحتوى</span>
            </button>
          </div>

          <div className="relative group">
            <div className="absolute -top-4 right-8 bg-[#161a1e] px-4 py-1 rounded-lg border border-white/5 text-[10px] font-black text-sky-400 uppercase tracking-widest z-20">Rich Text Editor</div>
            <div className="bg-white rounded-[2.5rem] overflow-hidden">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent}
                className="h-[600px] text-black"
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'direction': 'rtl' }],
                    ['clean'],
                    ['link']
                  ],
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[3.5rem]">
           <div className="text-6xl opacity-20">📜</div>
           <p className="text-slate-500 font-black text-xl italic leading-relaxed">يرجى تحديد اتفاقية قانونية من القائمة أعلاه للبدء في تحرير المحتوى الخاص بها.</p>
        </div>
      )}
    </div>
  );
};

export default LegalManagementPage;
