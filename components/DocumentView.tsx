import React, { useState, useEffect, useRef } from 'react';
import { StoredAnalysis, ThesisAnalysis, SectionAnalysis } from '../types';
import { AnalysisCard } from './AnalysisCard';
import { deleteDocument, saveAnalysis } from '../services/storageService';

interface DocumentViewProps {
  docData: StoredAnalysis; // Renamed from 'document' to avoid shadowing global 'document'
  folderName: string;
  onDelete: () => void;
}

export const DocumentView: React.FC<DocumentViewProps> = ({ docData, folderName, onDelete }) => {
  const [activeVersionId, setActiveVersionId] = useState<string | 'latest'>('latest');
  const [showHistory, setShowHistory] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(5);

  const [displayContent, setDisplayContent] = useState<ThesisAnalysis>(docData);
  const contentRef = useRef<HTMLDivElement>(null);

  // Update display content when docData prop changes
  useEffect(() => {
    setActiveVersionId('latest');
    setDisplayContent(docData);
    setShowHistory(false);
    setHistoryLimit(5);
  }, [docData.id]);

  // Handle version switching
  useEffect(() => {
    if (activeVersionId === 'latest') {
      setDisplayContent(docData);
    } else {
      const version = docData.history?.find(v => v.id === activeVersionId);
      if (version) {
        setDisplayContent(version.data);
      }
    }
  }, [activeVersionId, docData]);

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${docData.thesisTitle}"? Esta acción no se puede deshacer.`)) {
      deleteDocument(docData.id);
      onDelete();
    }
  };

  const handleSectionUpdate = (sectionIndex: number, updatedSection: SectionAnalysis) => {
    const newSections = [...displayContent.sections];
    newSections[sectionIndex] = updatedSection;
    
    const newAnalysis: ThesisAnalysis = {
      ...displayContent,
      sections: newSections
    };

    setDisplayContent(newAnalysis);
    // Persist changes
    saveAnalysis(newAnalysis, docData.folderId, docData.fileName);
  };

  const handleExportJSON = () => {
    try {
      // Use displayContent to export what is currently seen, or docData for the full object
      const jsonString = JSON.stringify(docData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const link = window.document.createElement("a"); // Use window.document explicitly
      link.href = url;
      link.download = `${docData.fileName.replace('.pdf', '')}_analysis.json`;
      
      window.document.body.appendChild(link); // Use window.document explicitly
      link.click();
      
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error exporting JSON:", e);
      alert("Hubo un error al exportar el archivo.");
    }
  };

  const handleExportPDF = () => {
    if (!contentRef.current) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes para exportar a PDF.");
      return;
    }

    const content = contentRef.current.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Analisis: ${displayContent.thesisTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: '#4F46E5',
                    secondary: '#10B981',
                    accent: '#F59E0B',
                  }
                }
              }
            }
          </script>
          <style>
            @media print {
              @page { margin: 1.5cm; size: auto; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print, .print\\:hidden { display: none !important; }
              .break-inside-avoid, .print\\:break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
            }
            body { padding: 40px; font-family: sans-serif; background-color: white; }
          </style>
        </head>
        <body>
          <div class="mb-8 border-b pb-4">
             <h1 class="text-3xl font-bold text-slate-900 mb-2">Mastery AI - Reporte de Análisis</h1>
             <p class="text-sm text-slate-500">Documento: ${docData.fileName}</p>
             <p class="text-sm text-slate-500">Fecha: ${new Date().toLocaleDateString()}</p>
          </div>
          ${content}
          <script>
            setTimeout(() => {
              window.print();
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('es-ES', { 
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="animate-fade-in-up pb-10">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-400">Carpeta: {folderName}</span>
          <span>/</span>
          <span className="text-primary truncate font-medium max-w-[200px]">{docData.fileName}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Guardar JSON
          </button>

          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar PDF
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <div className="relative">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{activeVersionId === 'latest' ? 'Versión Actual' : 'Versión Anterior'}</span>
              <span className="bg-slate-100 text-slate-500 px-1.5 rounded-md border border-slate-200">
                {docData.history?.length || 1}
              </span>
            </button>

            {showHistory && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden animate-fade-in">
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Historial de Revisiones</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {docData.history && docData.history.slice(0, historyLimit).map((version, idx) => (
                    <button
                      key={version.id}
                      onClick={() => { setActiveVersionId(version.id); setShowHistory(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col gap-1
                        ${activeVersionId === version.id ? 'bg-indigo-50/50' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center">
                         <span className={`font-semibold ${activeVersionId === version.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                           {version.note || `Versión ${docData.history.length - idx}`}
                         </span>
                         {activeVersionId === version.id && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(version.timestamp)}</span>
                    </button>
                  ))}
                  
                   {docData.history && docData.history.length > historyLimit && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setHistoryLimit(prev => prev + 5); }}
                       className="w-full text-center py-2 text-xs text-indigo-600 font-medium hover:bg-indigo-50"
                     >
                       Ver más antiguos...
                     </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:border-red-300 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div ref={contentRef}>
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 mb-10 relative overflow-hidden print:shadow-none print:border-slate-300">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
            </div>
            <div className="relative z-10">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              {displayContent.thesisTitle}
            </h1>
            {displayContent.author && (
              <p className="text-lg text-slate-500 font-medium mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {displayContent.author}
              </p>
            )}
            <div className="bg-slate-50 rounded-xl p-5 border-l-4 border-secondary print:bg-slate-100 print:border-black">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resumen Ejecutivo</h4>
              <p className="text-slate-700 leading-relaxed text-lg font-serif">
                {displayContent.generalSummary}
              </p>
            </div>
            </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Desglose de Temas</h3>
          <div className="text-sm text-slate-500">
            {displayContent.sections.length} secciones analizadas
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayContent.sections.map((section, idx) => (
            <AnalysisCard 
              key={idx} 
              section={section} 
              index={idx} 
              onUpdate={(updatedSection) => handleSectionUpdate(idx, updatedSection)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};