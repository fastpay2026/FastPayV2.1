import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

const LogoGenerator: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateLogo = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      await aistudio.openSelectKey();
      return;
    }
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [{
            text: 'A high-quality, professional logo for a financial network called "Fast Pay". The design features a stylized hawk or eagle head merged with a wing, representing speed and financial agility. Include a minimalist credit card icon. Use a metallic gold and deep navy blue color palette. The design should be clean, professional, and suitable for both light and dark backgrounds. Vector art style.',
          }],
        },
        config: {
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" },
        },
      });

      for (const part of response.candidates![0].content.parts) {
        if (part.inlineData) {
          setLogoUrl(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error("Error generating logo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 text-white rounded-xl">
      <button 
        onClick={generateLogo} 
        disabled={loading}
        className="px-4 py-2 bg-sky-600 rounded-lg font-bold"
      >
        {loading ? 'Generating...' : 'Generate New Logo'}
      </button>
      {logoUrl && (
        <div className="mt-4">
          <img src={logoUrl} alt="Generated Logo" className="w-64 h-64" />
        </div>
      )}
    </div>
  );
};

export default LogoGenerator;
