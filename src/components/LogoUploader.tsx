import React, { useState, useRef } from 'react';

interface Props {
  onLogoUploaded: (url: string) => void;
}

const LogoUploader: React.FC<Props> = ({ onLogoUploaded }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => processImage(img);
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple algorithm: make white/near-white pixels transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // If pixel is very light (near white), make it transparent
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // Set alpha to 0
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const processedUrl = canvas.toDataURL('image/png');
    setPreviewUrl(processedUrl);
  };

  const applyLogo = () => {
    if (previewUrl) {
      onLogoUploaded(previewUrl);
      alert("تم رفع الشعار ومعالجته بنجاح!");
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-sky-400">رفع شعار جديد</h2>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {previewUrl && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-slate-400">معاينة الشعار (بعد إزالة الخلفية):</p>
          <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-lg border border-slate-700 bg-slate-900" />
          <button 
            onClick={applyLogo}
            className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition-all duration-200"
          >
            اعتماد الشعار
          </button>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
