import React, { useState, useEffect } from 'react';
import { CustomPage } from '../../types';
import { supabaseService } from '../../supabaseService';

interface Props {
  pages: CustomPage[];
  setPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
}

const LegalManagementPage: React.FC<Props> = ({ pages, setPages }) => {
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [content, setContent] = useState('');

  const targetSlugs = ['terms-conditions', 'privacy-policy', 'security-standards', 'global-licenses'];
  const legalPages = pages.filter(p => targetSlugs.includes(p.slug));
  const languages = ['en', 'ar', 'fr', 'es', 'de', 'tr', 'ru', 'zh'];
  const [selectedLang, setSelectedLang] = useState('en');

  useEffect(() => {
    if (selectedPage) {
      try {
        const parsed = JSON.parse(selectedPage.content);
        setContent(parsed[selectedLang] || '');
      } catch (e) {
        setContent(selectedPage.content); // Fallback
      }
    }
  }, [selectedPage, selectedLang]);

  const handleSave = async () => {
    if (!selectedPage) return;
    
    let contentObj = {};
    try {
      contentObj = JSON.parse(selectedPage.content);
    } catch (e) {
      contentObj = {};
    }
    contentObj[selectedLang] = content;

    const updatedPage = { ...selectedPage, content: JSON.stringify(contentObj) };
    try {
      await supabaseService.upsertCustomPage(updatedPage);
      setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
      alert('تم حفظ التعديلات بنجاح!');
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ.');
    }
  };

  return (
    <div className="p-6 bg-[#161a1e] rounded-2xl border border-white/5 space-y-6">
      <h2 className="text-xl font-black text-white">إدارة الاتفاقيات القانونية</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {legalPages.map(page => (
          <button
            key={page.id}
            onClick={() => { setSelectedPage(page); setSelectedLang('en'); }}
            className={`p-4 rounded-xl border ${selectedPage?.id === page.id ? 'bg-sky-600 border-sky-500' : 'bg-[#0a0c10] border-white/10 hover:border-white/20'}`}
          >
            {page.title}
          </button>
        ))}
      </div>

      {selectedPage && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 rounded ${selectedLang === lang ? 'bg-sky-600' : 'bg-[#0a0c10] border border-white/10'}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 bg-[#0a0c10] text-white font-mono text-sm rounded-xl border border-white/10"
          />
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-sky-600 text-white font-black rounded-xl hover:bg-sky-500 transition-all"
          >
            حفظ
          </button>
        </div>
      )}
    </div>
  );
};

export default LegalManagementPage;
