import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { CustomPage } from '../../types';
import { supabaseService } from '../../supabaseService';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link as LinkIcon, 
  Heading1, Heading2, Heading3, 
  Undo, Redo, Eraser, Save, CheckCircle2,
  Globe, ShieldCheck
} from 'lucide-react';

interface Props {
  pages: CustomPage[];
  setPages: React.Dispatch<React.SetStateAction<CustomPage[]>>;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) => `
    p-2 rounded-lg transition-all
    ${isActive ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'text-slate-600 hover:bg-slate-100 hover:text-sky-500'}
  `;

  return (
    <div className="flex flex-wrap items-center gap-1 p-3 bg-slate-50 border-b border-slate-200 sticky top-0 z-30">
      <div className="flex items-center gap-1 pr-3 border-l border-slate-300 ml-3">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="عريض"><Bold size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="مائل"><Italic size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="تحته خط"><UnderlineIcon size={18} /></button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-l border-slate-300 ml-3">
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="عنوان 1"><Heading1 size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="عنوان 2"><Heading2 size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="عنوان 3"><Heading3 size={18} /></button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-l border-slate-300 ml-3">
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="يمين"><AlignRight size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="توسيط"><AlignCenter size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="يسار"><AlignLeft size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btnClass(editor.isActive({ textAlign: 'justify' }))} title="ضبط"><AlignJustify size={18} /></button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-l border-slate-300 ml-3">
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="قائمة منقطة"><List size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="قائمة مرقمة"><ListOrdered size={18} /></button>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} title="تراجع"><Undo size={18} /></button>
        <button onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} title="إعادة"><Redo size={18} /></button>
        <button onClick={() => editor.chain().focus().unsetAllMarks().run()} className={btnClass(false)} title="حذف التنسيق"><Eraser size={18} /></button>
      </div>
    </div>
  );
};

const LegalManagementPage: React.FC<Props> = ({ pages, setPages }) => {
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [selectedLang, setSelectedLang] = useState('ar');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
            class: 'text-sky-500 underline underline-offset-4',
        }
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[600px] p-10 bg-white text-slate-800 leading-relaxed font-medium text-lg text-right ql-editor',
      },
    },
  });

  const languages = [
    { code: 'ar', label: 'العربية' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'ru', label: 'Русский' }
  ];

  const targetSlugs = ['terms-of-service', 'privacy-policy', 'security-standards', 'global-licenses'];
  const legalPages = pages.filter(p => targetSlugs.includes(p.slug));

  useEffect(() => {
    if (selectedPage && editor) {
      let contentToShow = '';
      try {
        const parsed = JSON.parse(selectedPage.content);
        contentToShow = parsed[selectedLang] || '';
      } catch (e) {
        contentToShow = selectedPage.content;
      }
      editor.commands.setContent(contentToShow);
    }
  }, [selectedPage, selectedLang, editor]);

  const handleSave = async () => {
    if (!selectedPage || !editor) return;
    setIsSaving(true);
    
    let contentObj: any = {};
    try {
      contentObj = JSON.parse(selectedPage.content);
    } catch (e) {
      contentObj = { ar: selectedPage.content };
    }
    
    contentObj[selectedLang] = editor.getHTML();

    const updatedPage = { 
      ...selectedPage, 
      content: JSON.stringify(contentObj) 
    };

    try {
      await supabaseService.upsertCustomPage(updatedPage);
      setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('❌ حدث خطأ أثناء الحفظ.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            تحرير <span className="text-sky-500">الاتفاقيات</span>
            <ShieldCheck className="text-sky-500" size={40} />
          </h2>
          <p className="text-slate-400 font-bold text-lg">محرر Tiptap الاحترافي للوثائق القانونية الدقيقة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {targetSlugs.map(slug => {
          const page = legalPages.find(p => p.slug === slug);
          if (!page) return null;
          const isSelected = selectedPage?.id === page.id;
          return (
            <button
              key={page.id}
              onClick={() => setSelectedPage(page)}
              className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-right group relative overflow-hidden ${
                isSelected 
                  ? 'bg-sky-600 border-sky-400 shadow-[0_0_40px_rgba(14,165,233,0.3)] scale-[1.02]' 
                  : 'bg-[#1e252b] border-white/5 hover:border-sky-500/30'
              }`}
            >
              <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isSelected ? 'text-white/60' : 'text-sky-500'}`}>Official Agreement</div>
              <div className={`text-xl font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>{page.title}</div>
              <div className="mt-6 flex items-center justify-end gap-3">
                 <div className={`w-2 h-2 rounded-full ${page.isActive ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-500'}`}></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{page.isActive ? 'Published' : 'Draft'}</span>
              </div>
              {isSelected && (
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {selectedPage ? (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="flex flex-wrap items-center justify-between bg-[#1e252b] p-8 rounded-[2.5rem] border border-white/5 gap-8">
            <div className="flex items-center gap-6">
              <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
                      selectedLang === lang.code 
                        ? 'bg-sky-500 text-white shadow-lg' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-4 px-12 py-5 rounded-[1.5rem] font-black text-lg transition-all ${
                saveSuccess 
                  ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]' 
                  : 'bg-gradient-to-r from-sky-600 to-sky-500 text-white hover:from-sky-500 hover:to-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.3)] active:scale-95'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : saveSuccess ? (
                <><CheckCircle2 size={24} /> تم الحفظ بنجاح</>
              ) : (
                <><Save size={24} /> حفظ التغييرات</>
              )}
            </button>
          </div>

          <div className="relative p-[1px] bg-white/10 rounded-[3rem] shadow-3xl">
            <div className="absolute -top-4 right-12 bg-sky-500 px-6 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em] z-40 shadow-lg flex items-center gap-2">
               <Globe size={12} />
               {languages.find(l => l.code === selectedLang)?.label} Editor
            </div>
            <div className="bg-white rounded-[3rem] overflow-hidden flex flex-col shadow-inner">
              <MenuBar editor={editor} />
              <div className="overflow-y-auto max-h-[800px] custom-scrollbar p-2">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1e252b] py-40 rounded-[4rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center space-y-10 group transition-all hover:border-sky-500/20">
          <div className="w-32 h-32 rounded-3xl bg-sky-500/5 flex items-center justify-center border border-sky-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
            <Globe size={54} className="text-sky-500/20 group-hover:text-sky-500/40 transition-colors" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight">حدد وثيقة قانونية للتحرير</h3>
            <p className="text-slate-500 font-bold text-xl mt-3 max-w-md mx-auto leading-relaxed">اختر إحدى السياسات من القائمة أعلاه للبدء في صياغة المحتوى باحترافية</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalManagementPage;
