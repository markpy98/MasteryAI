import React, { useState, useEffect } from 'react';

export const LoadingView: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Iniciando análisis...");

  useEffect(() => {
    // Simulate progress stages
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setStage("Leyendo contenido del documento...");
          return prev + 1.5;
        } else if (prev < 60) {
          setStage("Analizando campos semánticos...");
          return prev + 0.8;
        } else if (prev < 85) {
          setStage("Aplicando Método Feynman...");
          return prev + 0.4;
        } else if (prev < 95) {
          setStage("Generando insights y gamificación...");
          return prev + 0.1;
        } else {
          return prev;
        }
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in w-full max-w-md mx-auto">
      
      {/* Icon Animation */}
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
        <div 
          className="absolute inset-0 border-4 border-primary rounded-full border-l-transparent border-b-transparent animate-spin"
          style={{ animationDuration: '2s' }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4 overflow-hidden relative">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
          style={{ width: `${Math.min(100, progress)}%` }}
        >
           <div className="absolute inset-0 bg-white/30 w-full h-full animate-shimmer"></div>
        </div>
      </div>

      <div className="flex justify-between w-full text-xs text-slate-500 font-medium mb-2 px-1">
         <span>{Math.round(progress)}%</span>
         <span>100%</span>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1">{stage}</h3>
      <p className="text-slate-500 text-sm text-center">
        Esto puede tomar unos segundos dependiendo de la complejidad.
      </p>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};