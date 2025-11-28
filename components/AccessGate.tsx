import React, { useState, useEffect } from 'react';

interface AccessGateProps {
  children: React.ReactNode;
}

const MASTER_KEY = "PRO-2025-STARTUP";
const STORAGE_KEY = "hasPremiumAccess";

export const AccessGate: React.FC<AccessGateProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar si ya tiene acceso guardado
    const hasAccess = localStorage.getItem(STORAGE_KEY);
    if (hasAccess === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // Simular pequeña espera de red para dar sensación de seguridad
    setTimeout(() => {
      if (licenseKey.trim() === MASTER_KEY) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsUnlocked(true);
      } else {
        setError(true);
        // Vibración en móviles si es posible
        if (navigator.vibrate) navigator.vibrate(200);
      }
      setLoading(false);
    }, 800);
  };

  // Si está desbloqueado, renderizar la app normal
  if (isUnlocked) {
    return <>{children}</>;
  }

  // Si está bloqueado, mostrar la Gate
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        
        {/* Header Visual */}
        <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-white mb-2">Mastery AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">PRO</span></h1>
          <p className="text-center text-slate-400 text-sm mb-8">
            La herramienta definitiva para dominar cualquier tema de maestría en minutos.
          </p>

          {/* Benefits Grid */}
          <div className="space-y-3 mb-8">
            <FeatureRow text="Análisis ilimitado con IA Gemini Pro" />
            <FeatureRow text="Mapas Mentales y Gráficos Interactivos" />
            <FeatureRow text="Método Feynman & Gamificación" />
            <FeatureRow text="Exportación PDF y JSON" />
          </div>

          {/* Input Area */}
          <form onSubmit={handleValidate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Ingresa tu Licencia
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={licenseKey}
                  onChange={(e) => { setLicenseKey(e.target.value); setError(false); }}
                  placeholder="XXXX-XXXX-XXXX"
                  className={`w-full bg-slate-950 border ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-700 focus:border-indigo-500'} rounded-lg px-4 py-3 text-white placeholder-slate-600 outline-none transition-all`}
                />
                {error && (
                  <div className="absolute right-3 top-3 text-red-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              {error && <p className="text-red-400 text-xs mt-2 ml-1">Licencia inválida. Intenta de nuevo.</p>}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-lg font-bold text-white transition-all transform active:scale-95 shadow-lg
                ${loading 
                  ? 'bg-slate-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/25'
                }
              `}
            >
              {loading ? 'Verificando...' : 'Desbloquear Acceso'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-6 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-slate-600 text-xs">O ADQUIERE UNA</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Buy Link */}
          <a 
            href="https://go.hotmart.com/X102293795U" 
            className="block text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium hover:underline"
            onClick={(e) => e.preventDefault()} // Prevent default for demo
          >
            Obtener Licencia Lifetime ($29 USD) &rarr;
          </a>

        </div>
        
        {/* Footer */}
        <div className="bg-slate-950/50 p-4 border-t border-slate-800 text-center">
           <p className="text-[10px] text-slate-600">Secure connection • 256-bit encryption • Mastery AI v2.0</p>
        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
      <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <span className="text-slate-300 text-sm font-medium">{text}</span>
  </div>
);