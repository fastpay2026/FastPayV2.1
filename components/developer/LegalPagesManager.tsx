
import React, { useState, useEffect, useMemo } from 'react';
import { CustomPage } from '../../types';
import { supabaseService } from '../../supabaseService';

interface Props {
  pages: CustomPage[];
  setPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
}

const LegalPagesManager: React.FC<Props> = ({ pages, setPages }) => {
  const legalSlugs = ['privacy-policy', 'terms-of-service', 'security-standards', 'global-licenses'];
  
  const [selectedLang, setSelectedLang] = useState('ar');
  const languages = ['ar', 'en', 'fr', 'tr', 'zh', 'ku', 'ru'];

  const legalPages = useMemo(() => legalSlugs.map(slug => {
    const existing = pages.find(p => p.slug === slug);
    return existing || {
      id: `legal-${slug}`, // Consistent ID for legal pages
      title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      slug,
      content: { ar: '', en: '', fr: '', tr: '', zh: '', ku: '', ru: '' },
      isActive: true,
      showInNavbar: false,
      showInFooter: true
    };
  }), [pages]);

  const [editingPage, setEditingPage] = useState<CustomPage>(legalPages[0]);

  useEffect(() => {
    const match = legalPages.find(p => p.slug === editingPage.slug);
    if (match) {
        setEditingPage(match);
    }
  }, [legalPages]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const updatedPage = editingPage;
        await supabaseService.upsertCustomPage(updatedPage);
        setPages(prev => {
            const exists = prev.find(p => p.id === updatedPage.id);
            if (exists) {
                return prev.map(p => p.id === updatedPage.id ? updatedPage : p);
            } else {
                return [...prev, updatedPage];
            }
        });
        alert('✅ تم حفظ التغييرات بنجاح في قاعدة البيانات');
    } catch (error) {
        console.error('Error saving page:', error);
        alert('❌ فشل حفظ التغييرات. يرجى المحاولة مرة أخرى.');
    } finally {
        setIsSaving(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="space-y-8 animate-in slide-in-from-right">
      <h2 className="text-4xl font-black">إدارة الصفحات القانونية</h2>
      <div className="flex gap-4">
        {legalPages.map(page => (
            <button 
                key={page.slug}
                onClick={() => setEditingPage(page)}
                className={`p-4 rounded-xl font-bold ${editingPage.slug === page.slug ? 'bg-sky-600 text-white' : 'bg-white/5 text-slate-400'}`}
            >
                {page.title}
            </button>
        ))}
      </div>
      
      <div className="bg-[#0f172a] p-8 rounded-2xl border border-white/5 space-y-4">
        <div className="flex gap-2">
            {languages.map(lang => (
                <button 
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1 rounded ${selectedLang === lang ? 'bg-sky-600 text-white' : 'bg-white/5'}`}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>
        <h3 className="text-xl font-bold">{editingPage.title} ({selectedLang.toUpperCase()})</h3>
        <textarea 
            value={editingPage.content[selectedLang] || ''}
            onChange={e => setEditingPage(prev => ({ ...prev, content: { ...prev.content, [selectedLang]: e.target.value } }))}
            className="w-full h-96 p-4 bg-black/40 border border-white/10 rounded-xl outline-none focus:border-sky-500"
            placeholder={`أدخل النص لـ ${selectedLang.toUpperCase()} هنا...`}
        />
        <button onClick={handleSave} disabled={isSaving} className={`w-full p-4 rounded-xl font-black text-center ${isSaving ? 'bg-slate-600' : 'bg-emerald-600'}`}>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</button>
      </div>
    </div>
  );
};

export default LegalPagesManager;
