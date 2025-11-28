import React, { useState, useCallback, useEffect } from 'react';

interface YouTubeInputProps {
  onAnalyze: (transcript: string, title: string) => void;
  disabled: boolean;
}

export const YouTubeInput: React.FC<YouTubeInputProps> = ({ onAnalyze, disabled }) => {
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');

  // Extract Video ID from URL
  useEffect(() => {
    const extractVideoId = (inputUrl: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = inputUrl.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const id = extractVideoId(url);
    setVideoId(id);
    
    // We try to simulate fetching title, but since we can't do CORS requests easily without a backend,
    // we might just let the user edit the title or infer it later.
    // For now, if we have an ID, we assume a generic title unless changed.
    if (id && !videoTitle) {
      setVideoTitle(`Video de YouTube (${id})`);
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) {
      alert("Por favor ingresa la transcripción del video.");
      return;
    }
    // Use the entered title or a default one
    const finalTitle = videoTitle.trim() || (videoId ? `Video YouTube ${videoId}` : "Análisis de Video");
    onAnalyze(transcript, finalTitle);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* URL Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            1. Enlace del Video (Opcional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="pl-10 block w-full rounded-lg border-slate-300 border bg-slate-50 py-2.5 px-4 text-sm focus:ring-red-500 focus:border-red-500"
              disabled={disabled}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Usado para obtener la miniatura de referencia.</p>
        </div>

        {/* Video Preview */}
        {videoId && (
          <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200 animate-fade-in">
            <img 
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
              alt="Video Thumbnail" 
              className="w-24 h-16 object-cover rounded-md shadow-sm"
            />
            <div className="flex-1">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título del Documento</label>
               <input 
                 type="text" 
                 value={videoTitle}
                 onChange={(e) => setVideoTitle(e.target.value)}
                 className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-medium"
                 placeholder="Nombre para guardar este análisis"
               />
            </div>
          </div>
        )}

        {/* Transcript Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
            <span>2. Transcripción del Video (Requerido)</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Copia y pega el texto aquí</span>
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            className="block w-full rounded-lg border-slate-300 border bg-white p-3 text-sm focus:ring-red-500 focus:border-red-500 font-mono text-slate-600"
            placeholder="Pega aquí el texto completo del video o los subtítulos..."
            disabled={disabled}
          />
          <p className="mt-2 text-xs text-slate-500">
            Tip: En YouTube, ve a la descripción del video &rarr; "Mostrar transcripción" &rarr; Copia el texto.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={disabled || !transcript.trim()}
          className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all
            ${disabled || !transcript.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5'
            }
          `}
        >
          {disabled ? 'Procesando...' : 'Analizar Video'}
          {!disabled && (
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          )}
        </button>
      </form>
    </div>
  );
};