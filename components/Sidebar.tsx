import React, { useState } from 'react';
import { Folder, StoredAnalysis } from '../types';
import { moveDocument } from '../services/storageService';

interface SidebarProps {
  isOpen: boolean;
  folders: Folder[];
  documents: StoredAnalysis[];
  selectedFolderId: string;
  selectedDocId: string | null;
  onSelectFolder: (id: string) => void;
  onSelectDoc: (id: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onNewAnalysis: () => void;
  onOpenSettings: () => void;
  onRefreshData?: () => void; 
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  folders,
  documents,
  selectedFolderId,
  selectedDocId,
  onSelectFolder,
  onSelectDoc,
  onCreateFolder,
  onNewAnalysis,
  onOpenSettings,
  onRefreshData
}) => {
  const [createConfig, setCreateConfig] = useState<{ parentId: string | null, active: boolean }>({ parentId: null, active: false });
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['default']));

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) next.delete(folderId);
    else next.add(folderId);
    setExpandedFolders(next);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), createConfig.parentId);
      setNewFolderName('');
      setCreateConfig({ parentId: null, active: false });
    }
  };

  const startCreatingFolder = (parentId: string | null) => {
     setCreateConfig({ parentId, active: true });
     if (parentId) {
       const next = new Set(expandedFolders);
       next.add(parentId);
       setExpandedFolders(next);
     }
  };

  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData("docId", docId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData("docId");
    if (docId) {
       moveDocument(docId, targetFolderId);
       onSelectFolder(targetFolderId);
       if(onRefreshData) onRefreshData();
    }
  };

  const renderFolderTree = (parentId: string | null, depth = 0) => {
    const currentLevelFolders = folders.filter(f => f.parentId === parentId);

    // Si es un nivel anidado (depth > 0) y no hay carpetas, retornamos null para no pintar UL vacíos,
    // PERO solo si estamos seguros de que la recursión se llama dentro de un contexto válido.
    // La recursión se llama dentro del map de la carpeta padre.
    
    if (currentLevelFolders.length === 0 && depth === 0) {
      // Si es el nivel raíz y está vacío, permitimos que el componente padre maneje el mensaje de vacío si se desea,
      // o simplemente retornamos una lista vacía.
    }

    if (currentLevelFolders.length === 0) return null;

    return (
      <ul className={`space-y-1 ${depth > 0 ? 'ml-3 border-l border-slate-700 pl-2' : ''}`}>
        {currentLevelFolders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const isSelected = selectedFolderId === folder.id;
          const folderDocs = documents.filter(d => d.folderId === folder.id);
          const hasSubfolders = folders.some(f => f.parentId === folder.id);

          return (
            <li key={folder.id}>
              {/* Folder Row */}
              <div 
                className={`
                   group flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer
                   ${isSelected ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                `}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, folder.id)}
                onClick={() => onSelectFolder(folder.id)}
              >
                 <div className="flex items-center flex-1 overflow-hidden">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
                      className="p-1 hover:bg-slate-700 rounded mr-1"
                    >
                       <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                       </svg>
                    </button>
                    
                    <svg className={`w-4 h-4 mr-2 ${isSelected ? 'text-secondary' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="truncate">{folder.name}</span>
                 </div>

                 <button 
                   onClick={(e) => { e.stopPropagation(); startCreatingFolder(folder.id); }}
                   className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white"
                   title="Crear subcarpeta"
                 >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                 </button>
              </div>

              {/* Input para crear subcarpeta */}
              {createConfig.active && createConfig.parentId === folder.id && (
                <div className="ml-6 mt-1 mb-2">
                   <form onSubmit={handleCreateSubmit}>
                    <input
                      autoFocus
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Nombre subcarpeta..."
                      className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-primary"
                      onBlur={() => !newFolderName && setCreateConfig({parentId: null, active: false})}
                    />
                  </form>
                </div>
              )}

              {/* Contenido Expandido */}
              {isExpanded && (
                <div>
                   {/* Llamada recursiva para subcarpetas */}
                   {renderFolderTree(folder.id, depth + 1)}
                   
                   {/* Documentos de esta carpeta */}
                   {folderDocs.length > 0 && (
                      <ul className={`ml-3 ${hasSubfolders ? 'border-l border-slate-700 pl-2' : 'border-l border-slate-700 pl-2'} mt-1 space-y-0.5`}>
                        {folderDocs.map(doc => (
                          <li key={doc.id}>
                            <div 
                              draggable
                              onDragStart={(e) => handleDragStart(e, doc.id)}
                              onClick={() => onSelectDoc(doc.id)}
                              className={`
                                flex items-center px-2 py-1.5 rounded cursor-pointer text-xs
                                ${selectedDocId === doc.id ? 'bg-primary/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                              `}
                            >
                               <svg className="w-3 h-3 mr-2 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                               <span className="truncate">{doc.thesisTitle}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                   )}

                   {/* Estado Vacío */}
                   {folderDocs.length === 0 && !hasSubfolders && (
                      <div className="ml-8 text-[10px] text-slate-600 italic py-1">Vacío</div>
                   )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-slate-900 text-slate-100 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}
    >
        <div className="p-6 border-b border-slate-700 bg-slate-900 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-secondary text-2xl">⚡</span> 
              Mastery AI
            </h1>
            <p className="text-xs text-slate-400 mt-1">Gestión de Conocimiento</p>
          </div>
          <button 
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Configuración"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div className="p-4 shrink-0">
          <button 
            onClick={onNewAnalysis}
            className="w-full py-2.5 px-4 bg-primary hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-indigo-900/50 text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Análisis
          </button>
        </div>

        <div className="px-4 pb-2 flex items-center justify-between shrink-0">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biblioteca</span>
           <button 
              onClick={() => startCreatingFolder(null)}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded"
              title="Nueva carpeta raíz"
           >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
           </button>
        </div>

        {createConfig.active && createConfig.parentId === null && (
          <div className="px-4 mb-2 shrink-0">
            <form onSubmit={handleCreateSubmit}>
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre carpeta..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-primary"
                onBlur={() => !newFolderName && setCreateConfig({parentId: null, active: false})}
              />
            </form>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-slate-700">
           {renderFolderTree(null)}
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900 text-xs text-slate-500 text-center shrink-0">
          Arrastra temas para moverlos
        </div>
    </aside>
  );
};