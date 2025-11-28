import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings, exportAllData, importAllData } from '../services/storageService';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    userName: '',
    themeColor: 'indigo',
    detailLevel: 'detailed'
  });
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    window.location.reload(); 
    onClose();
  };

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mastery_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllData(content);
      if (success) {
        setImportStatus('success');
        setTimeout(() => {
           window.location.reload();
        }, 1500);
      } else {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Configuración</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* User Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tu Nombre</label>
            <input 
              type="text" 
              value={settings.userName}
              onChange={(e) => setSettings({...settings, userName: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Ej. Juan Pérez"
            />
            <p className="text-xs text-slate-500 mt-1">Se usará para personalizar las explicaciones de Feynman.</p>
          </div>

          {/* Theme Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color de Acento</label>
            <div className="flex gap-4">
              {[
                { id: 'indigo', color: 'bg-indigo-600' },
                { id: 'emerald', color: 'bg-emerald-600' },
                { id: 'rose', color: 'bg-rose-600' }
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSettings({...settings, themeColor: theme.id as any})}
                  className={`w-10 h-10 rounded-full ${theme.color} flex items-center justify-center transition-transform hover:scale-110 ${settings.themeColor === theme.id ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : ''}`}
                >
                  {settings.themeColor === theme.id && (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Detail Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Profundidad del Análisis</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSettings({...settings, detailLevel: 'concise'})}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${settings.detailLevel === 'concise' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                Conciso
                <span className="block text-xs font-normal opacity-70 mt-1">Resúmenes rápidos</span>
              </button>
              <button
                onClick={() => setSettings({...settings, detailLevel: 'detailed'})}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${settings.detailLevel === 'detailed' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                Detallado
                <span className="block text-xs font-normal opacity-70 mt-1">Análisis profundo</span>
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="pt-6 border-t border-slate-100">
             <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
               Memoria y Datos
             </h3>
             <p className="text-xs text-slate-500 mb-4">Exporta tu base de conocimiento para usarla en otros dispositivos (PC, Tablet, Móvil).</p>
             
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={handleExport}
                 className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Exportar Copia
               </button>
               
               <button 
                 onClick={handleImportClick}
                 className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                 Importar Datos
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept=".json" 
                 onChange={handleFileChange}
               />
             </div>

             {importStatus === 'success' && (
               <div className="mt-3 text-xs text-green-600 font-medium text-center bg-green-50 py-1 rounded">
                 ¡Datos importados correctamente! Recargando...
               </div>
             )}
             {importStatus === 'error' && (
               <div className="mt-3 text-xs text-red-600 font-medium text-center bg-red-50 py-1 rounded">
                 Error al importar. El archivo no es válido.
               </div>
             )}
          </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors shadow-lg shadow-slate-900/20"
          >
            Guardar y Salir
          </button>
        </div>
      </div>
    </div>
  );
};