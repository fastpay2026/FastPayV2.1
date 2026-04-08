
import React, { useState } from 'react';
import { SiteConfig } from '../../types';

interface Props {
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
}

const ContentManagement: React.FC<Props> = ({ siteConfig, onUpdateConfig }) => {
  const [config, setConfig] = useState(JSON.stringify(siteConfig, null, 2));

  const handleSave = () => {
    try {
      const parsed = JSON.parse(config);
      onUpdateConfig(parsed);
      alert('تم حفظ التعديلات بنجاح!');
    } catch (e) {
      alert('خطأ في صيغة الـ JSON. يرجى التأكد من صحة التنسيق.');
    }
  };

  return (
    <div className="p-6 bg-[#161a1e] rounded-2xl border border-white/5">
      <h2 className="text-xl font-black text-white mb-6">إدارة المحتوى الديناميكي</h2>
      <textarea
        value={config}
        onChange={(e) => setConfig(e.target.value)}
        className="w-full h-96 p-4 bg-[#0a0c10] text-white font-mono text-sm rounded-xl border border-white/10"
      />
      <button
        onClick={handleSave}
        className="mt-4 px-6 py-3 bg-sky-600 text-white font-black rounded-xl hover:bg-sky-500 transition-all"
      >
        حفظ التعديلات
      </button>
    </div>
  );
};

export default ContentManagement;
