import React, { useState, useEffect } from 'react';
import { SectionAnalysis, MindMapNode, DiagramData, GameData, GameType } from '../types';
import { MindMapViewer } from './MindMapViewer';
import { DiagramViewer } from './DiagramViewer';
import { GameViewer } from './GameViewer';
import { generateMindMapData, generateDiagramData, generateGamificationData } from '../services/geminiService';

interface AnalysisCardProps {
  section: SectionAnalysis;
  index: number;
  onUpdate: (updatedSection: SectionAnalysis) => void;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ section, index, onUpdate }) => {
  // Mind Map State
  const [showMindMap, setShowMindMap] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);

  // Graphic State
  const [showGraphic, setShowGraphic] = useState(false);
  const [loadingGraphic, setLoadingGraphic] = useState(false);
  const [graphicData, setGraphicData] = useState<DiagramData | null>(null);

  // Game State
  const [showGame, setShowGame] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);

  // Supplementary Info State
  const [showDetails, setShowDetails] = useState(false);

  // Editing State
  const [editMode, setEditMode] = useState<'none' | 'insight' | 'feynman'>('none');
  const [editText, setEditText] = useState('');

  // Share State
  const [copied, setCopied] = useState(false);

  const closeAll = () => {
    setShowMindMap(false);
    setShowGraphic(false);
    setShowGame(false);
  };

  const handleToggleMindMap = async () => {
    if (!showMindMap) closeAll();
    
    if (!showMindMap && !mindMapData) {
      setLoadingMap(true);
      setShowMindMap(true);
      try {
        const data = await generateMindMapData(section.title, section.feynmanExplanation);
        setMindMapData(data);
      } catch (e) {
        console.error("Failed to load map");
        setShowMindMap(false);
      } finally {
        setLoadingMap(false);
      }
    } else {
      setShowMindMap(!showMindMap);
    }
  };

  const handleToggleGraphic = async () => {
    if (!showGraphic) closeAll();

    if (!showGraphic && !graphicData) {
      setLoadingGraphic(true);
      setShowGraphic(true);
      try {
        const data = await generateDiagramData(section.title, section.feynmanExplanation);
        setGraphicData(data);
      } catch (e) {
        console.error("Failed to load graphic");
        setShowGraphic(false);
      } finally {
        setLoadingGraphic(false);
      }
    } else {
      setShowGraphic(!showGraphic);
    }
  };

  const handleToggleGameTab = () => {
    if (!showGame) {
      closeAll();
      setShowGame(true);
    } else {
      setShowGame(false);
    }
  };

  const generateGame = async (type?: GameType) => {
    setLoadingGame(true);
    
    // If no type is specified (Surprise Me), randomly pick one client-side to ensure variety
    // instead of relying solely on the AI which might get stuck in a pattern.
    let selectedType = type;
    if (!selectedType) {
       const types: GameType[] = ['memory', 'simulation', 'sequence', 'quiz', 'clicker'];
       selectedType = types[Math.floor(Math.random() * types.length)];
    }

    try {
      const data = await generateGamificationData(section.title, section.feynmanExplanation, selectedType);
      setGameData(data);
    } catch (e) {
      console.error("Failed to load game");
    } finally {
      setLoadingGame(false);
    }
  };

  const handleExitGame = () => {
    setGameData(null);
  };

  const startEditing = (mode: 'insight' | 'feynman') => {
    setEditMode(mode);
    setEditText(mode === 'insight' ? section.keyInsight : section.feynmanExplanation);
  };

  const cancelEditing = () => {
    setEditMode('none');
    setEditText('');
  };

  const saveEditing = () => {
    const updatedSection = { ...section };
    if (editMode === 'insight') {
      updatedSection.keyInsight = editText;
    } else if (editMode === 'feynman') {
      updatedSection.feynmanExplanation = editText;
    }
    onUpdate(updatedSection);
    setEditMode('none');
  };

  const handleShare = () => {
    const textToShare = `📚 *${section.title}*\n\n💡 *Idea Clave:* ${section.keyInsight}\n\n🧠 *Explicación Simple:* ${section.feynmanExplanation}\n\n_Generado con Mastery AI_`;
    
    navigator.clipboard.writeText(textToShare).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Error al copiar: ', err);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-300 h-fit break-inside-avoid print:break-inside-avoid print:shadow-none print:border-slate-300 flex flex-col group/card">
      {/* Header with rounded corners matching card */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start rounded-t-xl print:bg-slate-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm shrink-0 print:bg-black print:text-white">
            {index + 1}
          </span>
          <h3 className="text-lg font-semibold text-slate-800 leading-snug">{section.title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
            onClick={handleShare}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors print:hidden"
            title="Copiar explicación"
          >
            {copied ? (
               <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            ) : (
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
               </svg>
            )}
          </button>
          
          <span className={`
            text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ml-1 print:border-black print:text-black
            ${section.originalComplexity === 'Alta' ? 'bg-red-50 text-red-700 border-red-100' : 
              section.originalComplexity === 'Media' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
              'bg-green-50 text-green-700 border-green-100'}
          `}>
            {section.originalComplexity}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        
        {/* Key Insight */}
        <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 print:bg-white print:border-slate-300 relative group/insight">
          
          {editMode === 'insight' ? (
             <div className="flex flex-col gap-2">
               <textarea
                 value={editText}
                 onChange={(e) => setEditText(e.target.value)}
                 className="w-full text-sm p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                 rows={2}
                 autoFocus
               />
               <div className="flex gap-2 justify-end">
                 <button onClick={cancelEditing} className="text-xs px-3 py-1 text-slate-500 hover:bg-slate-200 rounded">Cancelar</button>
                 <button onClick={saveEditing} className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Guardar</button>
               </div>
             </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <p className="text-sm text-indigo-900 font-medium flex items-start gap-2 print:text-black w-full">
                  <svg className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 print:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{section.keyInsight}</span>
                </p>
                <button 
                  onClick={() => startEditing('insight')}
                  className="ml-2 p-1 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-100 rounded opacity-0 group-hover/insight:opacity-100 transition-opacity print:hidden"
                  title="Editar Idea Clave"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Feynman Explanation */}
        <div className="relative group/feynman">
          <div className="flex items-center justify-between mb-3">
             <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider print:text-black">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Analogía Feynman (Explicación Simple)
            </h4>
            
            {editMode !== 'feynman' && (
              <button 
                onClick={() => startEditing('feynman')}
                className="p-1 text-slate-300 hover:text-primary hover:bg-slate-100 rounded opacity-0 group-hover/feynman:opacity-100 transition-opacity print:hidden"
                title="Editar Explicación"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
            )}
          </div>
          
          {editMode === 'feynman' ? (
             <div className="flex flex-col gap-2">
               <textarea
                 value={editText}
                 onChange={(e) => setEditText(e.target.value)}
                 className="w-full text-sm p-3 border border-emerald-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                 rows={6}
                 autoFocus
               />
               <div className="flex gap-2 justify-end">
                 <button onClick={cancelEditing} className="text-xs px-3 py-1 text-slate-500 hover:bg-slate-200 rounded">Cancelar</button>
                 <button onClick={saveEditing} className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">Guardar Cambios</button>
               </div>
             </div>
          ) : (
            <div className="prose prose-sm prose-slate bg-slate-50 p-4 rounded-lg border-l-4 border-emerald-400 print:bg-white print:border-black">
              <p className="text-slate-700 italic print:text-black whitespace-pre-line">"{section.feynmanExplanation}"</p>
            </div>
          )}
        </div>

        {/* Tools Section (Tabs) */}
        <div className="border-t border-slate-100 pt-4 print:border-slate-300">
           {/* Hide buttons when printing */}
           <div className="flex flex-wrap gap-2 mb-4 no-print print:hidden">
             <button 
               onClick={handleToggleMindMap}
               className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors border
                ${showMindMap 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
               </svg>
               Mapa Mental
             </button>
             <button 
               onClick={handleToggleGraphic}
               className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors border
                ${showGraphic 
                  ? 'bg-accent/10 border-accent/30 text-accent' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
               </svg>
               Gráfico
             </button>
             <button 
               onClick={handleToggleGameTab}
               className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors border
                ${showGame
                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
             >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               Jugar / Simular
             </button>
           </div>

           {/* Mind Map Area */}
           {showMindMap && (
             <div className="animate-fade-in print:block">
               {loadingMap ? (
                 <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 print:hidden">
                   <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                   <p className="text-xs text-slate-500">Generando nodos conceptuales...</p>
                 </div>
               ) : mindMapData ? (
                 <MindMapViewer data={mindMapData} />
               ) : (
                 <div className="text-center py-4 text-sm text-red-500 print:hidden">No se pudo generar el mapa.</div>
               )}
             </div>
           )}

           {/* Graphic Area */}
           {showGraphic && (
             <div className="animate-fade-in print:block">
               {loadingGraphic ? (
                 <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 print:hidden">
                   <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                   <p className="text-xs text-slate-500">Diseñando gráfico visual...</p>
                 </div>
               ) : graphicData ? (
                 <DiagramViewer data={graphicData} />
               ) : (
                 <div className="text-center py-4 text-sm text-red-500 print:hidden">No se pudo generar el gráfico.</div>
               )}
             </div>
           )}

            {/* Game Area - Selection Logic */}
           {showGame && (
             <div className="animate-fade-in print:block">
               {loadingGame ? (
                 <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 print:hidden">
                   <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                   <p className="text-xs text-slate-500">Creando experiencia interactiva...</p>
                 </div>
               ) : gameData ? (
                 <GameViewer data={gameData} onBack={handleExitGame} />
               ) : (
                 <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-600 font-bold mb-3 text-center">Elige tu experiencia de aprendizaje:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                       <button onClick={() => generateGame('memory')} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center gap-1">
                          <span className="text-xl">🎴</span>
                          <span className="text-xs font-semibold text-slate-700">Memoria</span>
                       </button>
                       <button onClick={() => generateGame('simulation')} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center gap-1">
                          <span className="text-xl">🎛️</span>
                          <span className="text-xs font-semibold text-slate-700">Simulación</span>
                       </button>
                       <button onClick={() => generateGame('sequence')} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center gap-1">
                          <span className="text-xl">🔢</span>
                          <span className="text-xs font-semibold text-slate-700">Secuencia</span>
                       </button>
                       <button onClick={() => generateGame('quiz')} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center gap-1">
                          <span className="text-xl">🧠</span>
                          <span className="text-xs font-semibold text-slate-700">Quiz</span>
                       </button>
                        <button onClick={() => generateGame('clicker')} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex flex-col items-center gap-1">
                          <span className="text-xl">👆</span>
                          <span className="text-xs font-semibold text-slate-700">Arcade</span>
                       </button>
                       <button onClick={() => generateGame()} className="p-3 bg-slate-800 text-white border border-slate-900 rounded-lg hover:bg-slate-700 transition-all flex flex-col items-center gap-1 shadow-md">
                          <span className="text-xl">✨</span>
                          <span className="text-xs font-bold">Sorpréndeme</span>
                       </button>
                    </div>
                 </div>
               )}
             </div>
           )}
        </div>

        {/* Semantic Field */}
        <div className="print:mt-4">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 print:text-black">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Campo Semántico
          </h4>
          <div className="flex flex-wrap gap-2">
            {section.semanticField.map((word, idx) => (
              <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm print:border-black print:text-black">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Supplementary Info / Academic Depth */}
      <div className="border-t border-slate-200 mt-auto rounded-b-xl overflow-hidden print:border-slate-300">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 transition-colors text-left group print:hidden"
        >
           <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
             <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
             </svg>
             Profundidad Académica y Matices
           </span>
           <svg className={`w-4 h-4 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
        </button>
        
        {/* Render Always if printing, otherwise conditional */}
        <div className={`${showDetails ? 'block' : 'hidden'} print:block bg-slate-100 p-4 border-t border-slate-200 shadow-inner`}>
           <p className="text-xs text-slate-500 mb-3 italic print:hidden">Estos son los detalles técnicos, citas o fórmulas que se omitieron en la explicación simplificada para mantener la claridad, pero que son importantes para el rigor académico.</p>
           {section.supplementaryInfo && section.supplementaryInfo.length > 0 ? (
             <ul className="space-y-2">
               {section.supplementaryInfo.map((info, i) => (
                 <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    <span className="leading-relaxed">{info}</span>
                 </li>
               ))}
             </ul>
           ) : (
             <p className="text-xs text-slate-400 italic">No hay detalles suplementarios adicionales registrados.</p>
           )}
        </div>
      </div>
    </div>
  );
};