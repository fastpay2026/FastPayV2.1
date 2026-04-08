import React, { useState, useRef } from 'react';

interface Props {
  onLogoUploaded: (url: string) => void;
}

const LogoUploader: React.FC<Props> = ({ onLogoUploaded }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [tolerance, setTolerance] = useState(30);
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

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
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
    const { r: targetR, g: targetG, b: targetB } = hexToRgb(bgColor);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) + 
        Math.pow(g - targetG, 2) + 
        Math.pow(b - targetB, 2)
      );

      if (distance < tolerance) {
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
      
      <div className="mt-4 flex gap-4 items-center">
        <label className="text-sm text-slate-400">لون الخلفية:</label>
        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
        <label className="text-sm text-slate-400">السماحية (Tolerance):</label>
        <input type="range" min="0" max="255" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-32" />
      </div>

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
