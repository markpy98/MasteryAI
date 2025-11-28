import React, { useCallback, useState } from 'react';
import { YouTubeInput } from './YouTubeInput';

interface FileUploadProps {
  onFileSelected: (base64: string, fileName: string) => void;
  onVideoAnalysis: (transcript: string, title: string) => void;
  onJsonLoad: () => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelected, 
  onVideoAnalysis, 
  onJsonLoad, 
  disabled 
}) => {
  const [inputMode, setInputMode] = useState<'pdf' | 'youtube'>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // --- PDF HANDLERS ---
  const handleFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor sube solo archivos PDF.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      onFileSelected(base64Data, file.name);
    };
    reader.readAsDataURL(file);
  }, [onFileSelected]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, handleFile]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      
      {/* MODE TABS */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm mb-6 max-w-md mx-auto">
        <button
          onClick={() => setInputMode('pdf')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all
            ${inputMode === 'pdf' 
              ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documento PDF
        </button>
        <button
          onClick={() => setInputMode('youtube')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all
            ${inputMode === 'youtube' 
              ? 'bg-red-50 text-red-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          Video YouTube
        </button>
      </div>

      <div className="shadow-xl shadow-slate-200/50 rounded-2xl bg-white border border-slate-100 overflow-hidden">
        
        {/* INPUT CONTENT */}
        <div className="p-6 md:p-10">
          {inputMode === 'pdf' ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer
                ${isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
              `}
            >
              <input
                type="file"
                accept="application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={onInputChange}
                disabled={disabled}
              />
              
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className={`p-4 rounded-full ${fileName ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {fileName ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    )}
                  </svg>
                </div>
                
                <div className="space-y-1">
                  <p className="text-lg font-medium text-slate-700">
                    {fileName ? 'Archivo seleccionado' : 'Sube tu documento (PDF)'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {fileName ? fileName : 'Arrastra y suelta o haz clic para explorar'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="-m-6 md:-m-8 md:p-2"> 
              {/* Reset margins to let YouTubeInput fill naturally but respect outer container styles */}
              <div className="md:border-none border-none shadow-none p-0">
                <YouTubeInput onAnalyze={onVideoAnalysis} disabled={disabled} />
              </div>
            </div>
          )}
        </div>

        {/* SHARED FOOTER (JSON IMPORT) */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col items-center">
          <p className="text-xs text-slate-400 mb-2">¿Ya tienes un análisis guardado?</p>
          <button 
            onClick={onJsonLoad}
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Cargar Archivo JSON
          </button>
        </div>
      </div>
    </div>
  );
};