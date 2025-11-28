
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { LoadingView } from './components/LoadingView';
import { Sidebar } from './components/Sidebar';
import { SettingsView } from './components/SettingsView';
import { DocumentView } from './components/DocumentView';
import { AccessGate } from './components/AccessGate'; // NEW IMPORT
import { analyzeThesisPdf } from './services/geminiService';
import { getFolders, getDocuments, createFolder, saveAnalysis, getSettings, importSingleDocument } from './services/storageService';
import { AppState, Folder, StoredAnalysis } from './types';

const App: React.FC = () => {
  // State for Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<StoredAnalysis[]>([]);
  
  // State for Selection
  const [selectedFolderId, setSelectedFolderId] = useState<string>('default'); 
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // State for UI/Process
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Ref for file import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const refreshData = useCallback(() => {
    const loadedFolders = getFolders();
    const loadedDocs = getDocuments();
    setFolders(loadedFolders);
    setDocuments(loadedDocs);
    // Ensure selected folder still exists, else default
    if (loadedFolders.length > 0 && !loadedFolders.find(f => f.id === selectedFolderId)) {
       setSelectedFolderId(loadedFolders[0].id);
    }
  }, [selectedFolderId]);

  // Initial load
  useEffect(() => {
    refreshData();
    // Apply theme color based on settings
    const settings = getSettings();
    if(settings.themeColor) {
      document.documentElement.style.setProperty('--color-primary', settings.themeColor === 'rose' ? '#e11d48' : settings.themeColor === 'emerald' ? '#059669' : '#4f46e5');
    }
  }, []);

  const handleCreateFolder = (name: string, parentId: string | null) => {
    createFolder(name, parentId);
    refreshData();
  };

  const handleSelectFolder = (id: string) => {
    setSelectedFolderId(id);
    setSelectedDocId(null);
    setAppState(AppState.IDLE);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    setAppState(AppState.SUCCESS);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleNewAnalysisClick = () => {
    setSelectedDocId(null);
    setAppState(AppState.IDLE);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteDoc = () => {
    refreshData();
    setSelectedDocId(null);
    setAppState(AppState.IDLE);
  };

  const handleFileAnalysis = async (base64Pdf: string, fileName: string) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    try {
      const data = await analyzeThesisPdf(base64Pdf);
      
      // Save logic (handles updates/revisions internally)
      const savedDoc = saveAnalysis(data, selectedFolderId, fileName);
      
      // Refresh strictly after save to ensure persistence in UI
      refreshData();
      
      // Small delay to ensure state update propagates if needed
      setTimeout(() => {
        setSelectedDocId(savedDoc.id);
        setAppState(AppState.SUCCESS);
      }, 50);

    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
      setErrorMsg("Ocurrió un error al procesar el archivo. Asegúrate de que el PDF contiene texto seleccionable.");
    }
  };

  const handleLoadAnalysis = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const importedDoc = importSingleDocument(content);
      if (importedDoc) {
        refreshData();
        setSelectedDocId(importedDoc.id);
        setAppState(AppState.SUCCESS);
      } else {
        alert("Error al cargar el archivo. Formato inválido.");
      }
    };
    reader.readAsText(file);
    // Reset value so we can load same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Determine what content to show
  const activeDocument = documents.find(d => d.id === selectedDocId);
  const activeFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <AccessGate>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
        
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen}
          folders={folders}
          documents={documents}
          selectedFolderId={selectedFolderId}
          selectedDocId={selectedDocId}
          onSelectFolder={handleSelectFolder}
          onSelectDoc={handleSelectDoc}
          onCreateFolder={handleCreateFolder}
          onNewAnalysis={handleNewAnalysisClick}
          onRefreshData={refreshData}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Settings Modal */}
        {showSettings && (
          <SettingsView onClose={() => setShowSettings(false)} />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
          
          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-slate-800">Mastery AI</span>
            <div className="w-6"></div> {/* Spacer */}
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
            <div className="max-w-5xl mx-auto min-h-full">
              
              {/* VIEW: IDLE / UPLOAD */}
              {appState === AppState.IDLE && !activeDocument && (
                <div className="animate-fade-in py-8">
                  <div className="text-center mb-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-3">
                      Carpeta: {activeFolder?.name}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                      Comprende temas de <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Maestría al Instante</span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                      Arrastra tus documentos al panel. Gestiona tus temas con subcarpetas y genera mapas mentales de cada sección.
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 mb-8 border border-slate-100">
                    <FileUpload onFileSelected={handleFileAnalysis} disabled={false} />
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center">
                      <p className="text-xs text-slate-400 mb-3">¿Ya tienes un análisis guardado?</p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Cargar Archivo de Análisis (.json)
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".json" 
                        onChange={handleLoadAnalysis}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard 
                      title="Historial de Versiones" 
                      desc="Guarda automáticamente revisiones al resubir documentos. Recupera versiones anteriores."
                      icon="history"
                    />
                    <FeatureCard 
                      title="Mapas Mentales" 
                      desc="Visualiza la estructura de cada tema con un solo clic en los paneles de análisis."
                      icon="nodes"
                    />
                    <FeatureCard 
                      title="Organización Total" 
                      desc="Crea subcarpetas y arrastra tus temas para organizarlos jerárquicamente."
                      icon="folder"
                    />
                  </div>
                </div>
              )}

              {/* VIEW: LOADING */}
              {appState === AppState.ANALYZING && (
                <div className="h-full flex flex-col items-center justify-center">
                  <LoadingView />
                  <p className="text-slate-400 text-sm mt-8 animate-pulse">Guardando en carpeta "{activeFolder?.name}"...</p>
                </div>
              )}

              {/* VIEW: ERROR */}
              {appState === AppState.ERROR && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-red-50 p-6 rounded-full mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Error en el análisis</h3>
                  <p className="text-slate-600 max-w-md mb-8">{errorMsg}</p>
                  <button 
                    onClick={() => setAppState(AppState.IDLE)}
                    className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Volver al inicio
                  </button>
                </div>
              )}

              {/* VIEW: SUCCESS / DOCUMENT DETAIL */}
              {appState === AppState.SUCCESS && activeDocument && (
                <DocumentView 
                  docData={activeDocument} 
                  folderName={folders.find(f => f.id === activeDocument.folderId)?.name || '...'}
                  onDelete={handleDeleteDoc}
                />
              )}
              
            </div>
          </main>
        </div>
      </div>
    </AccessGate>
  );
};

// Feature Card Component (sin cambios)
const FeatureCard: React.FC<{title: string, desc: string, icon: 'folder' | 'history' | 'nodes'}> = ({ title, desc, icon }) => {
  const getIcon = () => {
    switch(icon) {
      case 'folder': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />;
      case 'history': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
      case 'nodes': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />;
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="w-12 h-12 bg-indigo-50 text-primary rounded-xl flex items-center justify-center mb-4">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {getIcon()}
        </svg>
      </div>
      <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
};

export default App;
