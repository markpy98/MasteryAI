import React, { useState, useEffect } from 'react';
import { GameData, GameElement } from '../types';

interface GameViewerProps {
  data: GameData;
  onBack: () => void;
}

export const GameViewer: React.FC<GameViewerProps> = ({ data, onBack }) => {
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'won' | 'lost'>('start');
  const [elements, setElements] = useState<GameElement[]>([]);
  
  // Timer State for Arcade
  const [timeLeft, setTimeLeft] = useState(30);

  // Simulation State
  const [simValues, setSimValues] = useState<Record<string, number>>({});
  
  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Memory State
  const [cards, setCards] = useState<{id: string, content: string, matchId: string, isFlipped: boolean, isMatched: boolean}[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]); // indices

  // Sequence State
  const [sequenceItems, setSequenceItems] = useState<{id: string, content: string, correctIndex: number}[]>([]);

  useEffect(() => {
    setScore(0);
    setGameState('start');
    setTimeLeft(30);
    
    // Initialize based on type
    if (data.type === 'clicker') {
      const randomized = (data.elements || []).map(el => ({
        ...el,
        x: Math.random() * 80,
        y: Math.random() * 80
      }));
      setElements(randomized);
    } else if (data.type === 'simulation' && data.simulationData) {
      const initial: Record<string, number> = {};
      data.simulationData.variables.forEach(v => initial[v.id] = v.defaultValue);
      setSimValues(initial);
    } else if (data.type === 'drag_drop') {
      setElements(data.elements || []);
    } else if (data.type === 'quiz') {
      setCurrentQuestion(0);
    } else if (data.type === 'memory' && data.memoryData) {
      const allCards = data.memoryData.pairs.map(p => ({
        id: p.id, content: p.content, matchId: p.matchId, isFlipped: false, isMatched: false
      }));
      // Shuffle
      setCards(allCards.sort(() => Math.random() - 0.5));
      setFlippedCards([]);
    } else if (data.type === 'sequence' && data.sequenceData) {
      // Shuffle items for initial state
      const shuffled = [...data.sequenceData.items].sort(() => Math.random() - 0.5);
      setSequenceItems(shuffled);
    }

  }, [data]);

  // Timer logic for Arcade
  useEffect(() => {
    if (gameState === 'playing' && data.type === 'clicker') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState('lost'); // Or won based on score, but usually time up means game over
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, data.type]);

  const handleStart = () => setGameState('playing');

  // --- CLICKER LOGIC ---
  const handleClickItem = (id: string, role: string) => {
    if (gameState !== 'playing') return;

    if (role === 'target' || role === 'draggable') {
      setScore(prev => prev + 10);
      setElements(prev => prev.filter(el => el.id !== id));
      
      const remainingTargets = elements.filter(el => el.id !== id && (el.role === 'target' || el.role === 'draggable')).length;
      if (remainingTargets === 0) setGameState('won');
    } else if (role === 'obstacle') {
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  // --- SIMULATION LOGIC ---
  const handleSimChange = (id: string, value: number) => {
    setSimValues(prev => ({ ...prev, [id]: value }));
  };

  const calculateSimOutcome = (): number => {
    if(!data.simulationData) return 0;
    // Simple placeholder logic: just multiply or add values
    // In a real app we would parse the formula string
    const vals = Object.values(simValues) as number[];
    return vals.reduce((a: number, b: number) => a + b, 0); 
  };

  // --- QUIZ LOGIC ---
  const handleOptionSelect = (index: number) => {
    if (showFeedback || !data.quizData) return;
    setSelectedOption(index);
    setShowFeedback(true);
    
    if (index === data.quizData[currentQuestion].correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (!data.quizData) return;
    if (currentQuestion < data.quizData.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowFeedback(false);
      setSelectedOption(null);
    } else {
      setGameState('won');
    }
  };

  // --- MEMORY LOGIC ---
  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || cards[index].isFlipped || cards[index].isMatched || flippedCards.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const idx1 = newFlipped[0];
      const idx2 = newFlipped[1];
      
      // Check match
      if (cards[idx1].matchId === cards[idx2].id || cards[idx1].id === cards[idx2].matchId) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === idx1 || i === idx2 ? { ...c, isMatched: true } : c));
          setFlippedCards([]);
          // Check win
          if (cards.every((c, i) => (i === idx1 || i === idx2) || c.isMatched)) {
            setGameState('won');
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === idx1 || i === idx2 ? { ...c, isFlipped: false } : c));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // --- SEQUENCE LOGIC ---
  const moveItem = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= sequenceItems.length) return;
    const newItems = [...sequenceItems];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;
    setSequenceItems(newItems);
  };

  const checkSequence = () => {
    const isCorrect = sequenceItems.every((item, index) => item.correctIndex === index);
    if (isCorrect) setGameState('won');
    else alert("Orden incorrecto. ¡Inténtalo de nuevo!");
  };

  // --- RENDERERS ---

  const renderClicker = () => (
    <div className="relative w-full h-80 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      <div className="absolute top-2 right-2 flex gap-2 z-20">
         <div className="bg-slate-800 text-white px-3 py-1 rounded-lg font-mono font-bold border border-slate-600">
           ⏳ {timeLeft}s
         </div>
         <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold shadow">
           ⭐ {score}
         </div>
      </div>
      
      {elements.map((el) => (
        <button
          key={el.id}
          onClick={() => handleClickItem(el.id, el.role)}
          className={`absolute flex items-center justify-center p-4 hover:scale-110 active:scale-95 cursor-pointer transition-transform animate-bounce-slow text-5xl`}
          style={{ 
            left: `${el.x}%`, 
            top: `${el.y}%`, 
            animationDuration: `${Math.random() * 2 + 1.5}s`,
            zIndex: 10
          }}
        >
          {el.emoji}
        </button>
      ))}
      
      {elements.length === 0 && gameState === 'playing' && (
         <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold text-xl animate-pulse">
           ¡Limpio!
         </div>
      )}
    </div>
  );

  const renderSimulation = () => {
    if (!data.simulationData) return null;
    const outcomeValue = calculateSimOutcome();
    // Normalize outcome for visual (just a dummy visualization logic for now)
    // Assuming max possible value roughly around 100-200 for demo
    const maxVal = data.simulationData.variables.reduce((a: number, b) => a + b.max, 0);
    const percentage = Math.min(100, (outcomeValue / maxVal) * 100);

    return (
      <div className="flex flex-col gap-6 max-w-lg mx-auto bg-white p-6 rounded-xl border border-slate-200">
         <div className="space-y-4">
           {data.simulationData.variables.map(v => (
             <div key={v.id}>
               <div className="flex justify-between mb-1">
                 <label className="text-sm font-bold text-slate-700">{v.label}</label>
                 <span className="text-sm text-indigo-600 font-mono">{simValues[v.id]}</span>
               </div>
               <input 
                 type="range" 
                 min={v.min} 
                 max={v.max} 
                 value={simValues[v.id] || v.min} 
                 onChange={(e) => handleSimChange(v.id, Number(e.target.value))}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               />
             </div>
           ))}
         </div>

         <div className="pt-4 border-t border-slate-100">
            <h4 className="text-center text-xs font-bold text-slate-400 uppercase mb-2">{data.simulationData.outcome.label}</h4>
            <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
               <div 
                 className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                 style={{ width: `${percentage}%` }}
               ></div>
               <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600 mix-blend-multiply">
                 Resultado: {outcomeValue.toFixed(1)}
               </span>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2 italic">{data.simulationData.outcome.formula}</p>
         </div>
      </div>
    );
  };

  const renderDragDrop = () => (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-4 flex-wrap p-4 min-h-[80px] bg-slate-100 rounded-xl border-dashed border-2 border-slate-300">
        {elements.filter(el => el.role === 'draggable').map(el => (
           <div 
             key={el.id} 
             className="bg-white px-4 py-2 rounded shadow flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-slate-50 border border-slate-200"
             onClick={() => handleClickItem(el.id, el.role)}
           >
             <span className="text-xl">{el.emoji}</span>
             <span className="font-bold text-sm text-slate-700">{el.label}</span>
           </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
         {elements.filter(el => el.role === 'dropzone').map(el => (
           <div key={el.id} className={`h-32 rounded-xl flex flex-col items-center justify-center border-2 ${el.color ? `bg-${el.color.split('-')[1]}-50 border-${el.color.split('-')[1]}-200` : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-3xl mb-2">{el.emoji}</div>
              <div className="font-bold text-slate-600">{el.label}</div>
           </div>
         ))}
      </div>
      <p className="text-xs text-center text-slate-400 italic">Toca los items para clasificarlos (Simulado)</p>
    </div>
  );

  const renderQuiz = () => {
    if (!data.quizData) return null;
    const q = data.quizData[currentQuestion];
    
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-4 text-sm text-slate-500 font-bold uppercase tracking-wider">Pregunta {currentQuestion + 1} de {data.quizData.length}</div>
        <h4 className="text-lg font-bold text-slate-800 mb-6">{q.question}</h4>
        
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";
            if (showFeedback) {
              if (idx === q.correctIndex) btnClass += "bg-green-100 border-green-300 text-green-800";
              else if (idx === selectedOption) btnClass += "bg-red-100 border-red-300 text-red-800";
              else btnClass += "bg-slate-50 border-slate-200 opacity-50";
            } else {
              btnClass += "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
            }

            return (
              <button key={idx} disabled={showFeedback} onClick={() => handleOptionSelect(idx)} className={btnClass}>
                {opt}
              </button>
            )
          })}
        </div>

        {showFeedback && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-fade-in">
             <p className="text-sm text-indigo-800 font-medium mb-2">{selectedOption === q.correctIndex ? '¡Correcto!' : 'Ups, no es esa.'}</p>
             <p className="text-sm text-slate-600">{q.explanation}</p>
             <button onClick={nextQuestion} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">
               {currentQuestion < data.quizData.length - 1 ? 'Siguiente Pregunta' : 'Finalizar'}
             </button>
          </div>
        )}
      </div>
    );
  };

  const renderMemory = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          onClick={() => handleCardClick(idx)}
          className={`
            aspect-[4/3] rounded-xl cursor-pointer perspective-1000 transition-all duration-500 relative transform-style-3d
            ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}
          `}
        >
          {/* Front (Hidden) */}
          <div className={`
             absolute inset-0 bg-indigo-600 rounded-xl flex items-center justify-center backface-hidden shadow-md
             ${card.isFlipped || card.isMatched ? 'opacity-0' : 'opacity-100'} transition-opacity
          `}>
            <span className="text-2xl">❓</span>
          </div>

          {/* Back (Visible) */}
          <div className={`
            absolute inset-0 bg-white border-2 rounded-xl flex items-center justify-center p-2 text-center backface-hidden shadow-md
            ${card.isMatched ? 'border-green-400 bg-green-50' : 'border-indigo-200'}
            ${card.isFlipped || card.isMatched ? 'opacity-100 rotate-y-180' : 'opacity-0'}
          `}>
             <span className="text-xs md:text-sm font-semibold text-slate-800">{card.content}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSequence = () => (
    <div className="max-w-md mx-auto space-y-2">
      {sequenceItems.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
           <div className="flex flex-col gap-1">
             <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
             </button>
             <button onClick={() => moveItem(idx, 1)} disabled={idx === sequenceItems.length - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </button>
           </div>
           <div className="flex-1 text-sm font-medium text-slate-700 border-l border-slate-100 pl-3">
             {item.content}
           </div>
           <div className="text-slate-300 font-bold text-xl px-2">
             {idx + 1}
           </div>
        </div>
      ))}
      <button onClick={checkSequence} className="w-full mt-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
        Verificar Orden
      </button>
    </div>
  );

  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center relative">
      <div className="absolute top-4 right-4">
        <button 
          onClick={onBack}
          className="text-xs px-2 py-1 bg-white border border-slate-300 rounded text-slate-500 hover:text-red-500 hover:border-red-300 transition-colors"
        >
          Cambiar Juego
        </button>
      </div>

      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase rounded-full mb-2">
          {data.type === 'quiz' ? '🧠 Quiz' : data.type === 'memory' ? '🎴 Memoria' : data.type === 'sequence' ? '🔢 Secuencia' : data.type === 'simulation' ? '🎛️ Simulación' : '🕹️ Arcade'}
        </span>
        <h3 className="text-xl font-bold text-slate-900">{data.title}</h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">{data.instructions}</p>
      </div>

      {gameState === 'start' && (
        <button 
          onClick={handleStart}
          className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
        >
          ¡Comenzar!
        </button>
      )}

      {gameState === 'playing' && (
        <div className="animate-fade-in mt-6">
          {data.type === 'clicker' && renderClicker()}
          {data.type === 'simulation' && renderSimulation()}
          {data.type === 'drag_drop' && renderDragDrop()}
          {data.type === 'quiz' && renderQuiz()}
          {data.type === 'memory' && renderMemory()}
          {data.type === 'sequence' && renderSequence()}
        </div>
      )}

      {gameState === 'won' && (
        <div className="py-8 animate-bounce-in">
          <div className="text-6xl mb-4">🏆</div>
          <h4 className="text-2xl font-bold text-slate-800 mb-2">¡Excelente Trabajo!</h4>
          <p className="text-slate-600 mb-6">Has completado el desafío.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setGameState('start'); if(data.type==='memory') setFlippedCards([]); }} className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">
              Jugar de nuevo
            </button>
            <button onClick={onBack} className="px-6 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200">
              Otro Juego
            </button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div className="py-8 animate-fade-in">
          <div className="text-6xl mb-4">⏰</div>
          <h4 className="text-2xl font-bold text-slate-800 mb-2">¡Tiempo Agotado!</h4>
          <p className="text-slate-600 mb-6">Inténtalo más rápido la próxima vez.</p>
           <div className="flex gap-2 justify-center">
            <button onClick={() => { setGameState('start'); }} className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">
              Reintentar
            </button>
            <button onClick={onBack} className="px-6 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg hover:bg-indigo-200">
              Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};