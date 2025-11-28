import React, { useState } from 'react';
import { DiagramData } from '../types';

interface DiagramViewerProps {
  data: DiagramData;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ data }) => {
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // --- RENDERERS ---

  const renderProcess = () => {
    const items = data.items || [];
    
    // Interactive Step-by-Step Mode
    if (interactiveMode && items.length > 0) {
      const step = items[currentStep];
      const progress = ((currentStep + 1) / items.length) * 100;

      return (
        <div className="flex flex-col items-center max-w-lg mx-auto py-4">
           {/* Progress Bar */}
           <div className="w-full bg-slate-200 h-2 rounded-full mb-6 overflow-hidden">
             <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
           </div>

           {/* Current Step Card */}
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full text-center animate-fade-in-up min-h-[200px] flex flex-col justify-center items-center">
              <div className="text-5xl mb-4 animate-bounce-slow">{step.icon || '📍'}</div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">{step.label}</h4>
              <p className="text-slate-600">{step.detail}</p>
           </div>

           {/* Controls */}
           <div className="flex items-center gap-4 mt-8">
             <button 
               onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
               disabled={currentStep === 0}
               className="p-3 rounded-full bg-white shadow border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
             >
               <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             </button>
             <span className="text-sm font-bold text-slate-400 tracking-wider">PASO {currentStep + 1} / {items.length}</span>
             <button 
               onClick={() => setCurrentStep(Math.min(items.length - 1, currentStep + 1))}
               disabled={currentStep === items.length - 1}
               className="p-3 rounded-full bg-white shadow border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
             >
               <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
             </button>
           </div>
        </div>
      );
    }

    // Classic Linear View
    return (
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 overflow-x-auto py-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col md:flex-row items-center flex-1 group min-w-[150px]">
            <div className="relative flex flex-col items-center p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full">
              <div className="text-3xl mb-2">{item.icon || '📍'}</div>
              <h4 className="font-bold text-slate-800 text-center text-sm">{item.label}</h4>
              <div className="mt-2 h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden text-center">
                 <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 mt-2">{item.detail}</p>
              </div>
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-xs font-bold border border-slate-200">
                {idx + 1}
              </div>
            </div>
            {idx < items.length - 1 && (
              <div className="hidden md:block mx-2 text-slate-300">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
              </div>
            )}
             {idx < items.length - 1 && (
              <div className="md:hidden my-2 text-slate-300 rotate-90">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCycle = () => {
    const items = data.items || [];
    return (
      <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center p-8">
        {/* Central Hub */}
        <div className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center z-10 shadow-inner">
          <span className="text-center font-bold text-indigo-900 text-sm px-2">{data.title}</span>
        </div>
        
        {/* Orbit Items */}
        {items.map((item, idx) => {
          const total = items.length;
          const angle = (360 / total) * idx - 90; // Start from top
          const radius = 140; // distance from center
          const x = radius * Math.cos((angle * Math.PI) / 180);
          const y = radius * Math.sin((angle * Math.PI) / 180);

          return (
            <div 
              key={idx}
              className="absolute w-24 h-24 flex flex-col items-center justify-center bg-white rounded-full shadow-md border border-slate-200 hover:scale-110 hover:z-20 hover:border-indigo-400 transition-all cursor-pointer group"
              style={{ 
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
               <div className="text-xl">{item.icon || '🔄'}</div>
               <div className="text-[10px] font-bold text-slate-700 text-center leading-tight px-2">{item.label}</div>
               
               {/* Tooltip */}
               <div className="absolute top-full mt-2 w-40 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 shadow-xl">
                 {item.detail}
               </div>
            </div>
          );
        })}
        
        {/* SVG Arrows connecting */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 animate-spin-slow" style={{animationDuration: '60s'}}>
            <circle cx="50%" cy="50%" r="140" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" />
         </svg>
      </div>
    );
  };

  const renderHierarchy = () => (
    <div className="flex flex-col-reverse items-center gap-1 w-full max-w-lg mx-auto py-6">
      {(data.items || []).map((item, idx) => {
        const total = (data.items || []).length;
        const widthPercent = 100 - (idx * (80 / Math.max(total, 1))); // Calculate width shrinking
        const opacity = 1 - (idx * 0.05);
        return (
          <div 
            key={idx}
            style={{ width: `${widthPercent}%`, opacity }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 relative group cursor-default"
          >
             <div className="flex items-center justify-between">
               <span className="font-bold">{item.label}</span>
               <span className="text-lg opacity-70">{item.icon}</span>
             </div>
             <div className="max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-500">
                <p className="text-xs text-white/90 mt-2 pt-2 border-t border-white/20">{item.detail}</p>
             </div>
          </div>
        );
      })}
      <div className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">Base / Fundamentos</div>
    </div>
  );

  const renderComparison = () => {
    if (!data.comparisonData) return null;
    return (
      <div className="grid grid-cols-2 gap-4 md:gap-8 w-full">
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
          <h4 className="font-bold text-rose-800 text-center mb-4 border-b border-rose-200 pb-2">{data.comparisonData.leftTitle}</h4>
          <ul className="space-y-2">
            {data.comparisonData.leftItems.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-rose-700 bg-white/50 p-2 rounded">
                 <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
                 {it}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <h4 className="font-bold text-emerald-800 text-center mb-4 border-b border-emerald-200 pb-2">{data.comparisonData.rightTitle}</h4>
          <ul className="space-y-2">
            {data.comparisonData.rightItems.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-700 bg-white/50 p-2 rounded">
                 <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                 {it}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderAnalogy = () => {
     if (!data.analogyData) return null;
     return (
       <div className="space-y-6">
         <div className="flex items-center justify-between bg-slate-800 text-white p-4 rounded-xl shadow-lg">
            <div className="text-center flex-1">
              <div className="text-xs uppercase text-slate-400 mb-1">Concepto Complejo</div>
              <div className="font-bold text-lg text-secondary">{data.analogyData.targetConcept}</div>
            </div>
            <div className="px-4">
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="text-center flex-1">
              <div className="text-xs uppercase text-slate-400 mb-1">Mundo Real</div>
              <div className="font-bold text-lg text-accent">{data.analogyData.sourceConcept}</div>
            </div>
         </div>

         <div className="space-y-3">
           {data.analogyData.mapping.map((m, idx) => (
             <div key={idx} className="flex items-stretch bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="w-1/3 bg-indigo-50 p-3 flex items-center justify-center text-center border-r border-indigo-100">
                  <span className="text-sm font-semibold text-indigo-900">{m.target}</span>
                </div>
                <div className="flex-1 p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-xs font-bold text-slate-400">ES COMO</span>
                     <span className="text-sm font-bold text-slate-800">{m.source}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">"{m.explanation}"</p>
                </div>
             </div>
           ))}
         </div>
       </div>
     );
  };

  return (
    <div className="bg-slate-50/50 p-6 rounded-xl border border-dashed border-slate-300">
       <div className="text-center mb-6">
         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            {data.type === 'cycle' && '🔄 Ciclo'}
            {data.type === 'process' && '➡️ Proceso'}
            {data.type === 'comparison' && '⚖️ Comparación'}
            {data.type === 'hierarchy' && '🔺 Jerarquía'}
            {data.type === 'analogy' && '💡 Analogía'}
         </div>
         <h3 className="text-xl font-bold text-slate-800">{data.title}</h3>
         <p className="text-sm text-slate-500">{data.description}</p>
         
         {data.type === 'process' && (data.items || []).length > 2 && (
           <div className="mt-4 flex justify-center">
             <label className="flex items-center cursor-pointer bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={interactiveMode} onChange={() => { setInteractiveMode(!interactiveMode); setCurrentStep(0); }} />
                  <div className={`block w-8 h-5 rounded-full transition-colors ${interactiveMode ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${interactiveMode ? 'transform translate-x-3' : ''}`}></div>
                </div>
                <div className="ml-2 text-xs font-semibold text-slate-600">Modo Interactivo</div>
             </label>
           </div>
         )}
       </div>

       <div className="animate-fade-in">
         {data.type === 'process' && renderProcess()}
         {data.type === 'cycle' && renderCycle()}
         {data.type === 'hierarchy' && renderHierarchy()}
         {data.type === 'comparison' && renderComparison()}
         {data.type === 'analogy' && renderAnalogy()}
       </div>
    </div>
  );
};