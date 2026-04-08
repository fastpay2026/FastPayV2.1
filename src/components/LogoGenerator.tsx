import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Props {
  onLogoGenerated: (url: string) => void;
}

const LogoGenerator: React.FC<Props> = ({ onLogoGenerated }) => {
  const [tempLogoUrl, setTempLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateLogo = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      await aistudio.openSelectKey();
    }
    
    setLoading(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found. Please ensure you have selected a key.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{
            text: 'A luxurious, professional logo for a financial network called "FastFlow Group". The design features a minimalist, elegant emblem that combines a stylized hawk or eagle head merged with a subtle credit card or digital circuit pattern, representing speed, security, and financial agility. Color palette: vibrant sky blue (hex #0ea5e9) and metallic silver/white to contrast against a deep black background (#0a0a0a). The design should be clean, sophisticated, and isolated on a solid black background (#0a0a0a) to seamlessly blend with the website\'s dark theme. Vector art style, high-end branding.',
          }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        },
      });

      for (const part of response.candidates![0].content.parts) {
        if (part.inlineData) {
          setTempLogoUrl(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error("Error generating logo:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveLogo = () => {
    if (tempLogoUrl) {
      onLogoGenerated(tempLogoUrl);
      alert("تم حفظ الشعار وتحديثه في الموقع بنجاح!");
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-gold-500">Logo Generator</h2>
      <div className="flex gap-4">
        <button 
          onClick={generateLogo} 
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate New Luxurious Logo'}
        </button>
        {tempLogoUrl && (
          <button 
            onClick={saveLogo}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold transition-all duration-200"
          >
            Save & Apply Logo
          </button>
        )}
      </div>
      {tempLogoUrl && (
        <div className="mt-6">
          <img src={tempLogoUrl} alt="Generated Luxury Logo" className="w-64 h-64 rounded-lg border-2 border-slate-700" />
        </div>
      )}
    </div>
  );
};

export default LogoGenerator;
