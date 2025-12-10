import React, { useState } from 'react';
import { MindMapNode } from '../types';

interface MindMapViewerProps {
  data: MindMapNode;
}

const NodeItem: React.FC<{ node: MindMapNode; isRoot?: boolean }> = ({ node, isRoot = false }) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          group z-10 px-4 py-2 rounded-lg shadow-sm border text-center transition-all hover:scale-105 cursor-default relative
          ${isRoot 
            ? 'bg-indigo-600 text-white border-indigo-700 font-bold text-lg mb-8 shadow-md ring-4 ring-indigo-50 max-w-sm' 
            : 'bg-white text-slate-700 border-slate-200 text-sm font-medium mb-6 hover:border-indigo-300 hover:shadow-md max-w-[180px]'
          }
        `}
      >
        {node.label}
        
        {/* Tooltip Description */}
        {node.description && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            {node.description}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        )}

        {/* Connector dot for bottom */}
        {hasChildren && (
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${isRoot ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
        )}
      </div>
      
      {hasChildren && (
        <div className="flex relative">
           {/* Top vertical connector from parent to horizontal bar */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-slate-300 -mt-6"></div>
           
           <div className="flex gap-6 md:gap-12 relative pt-4">
              {/* Horizontal bar connecting children */}
              {node.children!.length > 1 && (
                 <div className="absolute top-0 left-0 right-0 h-px bg-slate-300 mx-[calc(50%_-_1px)]">
                    <div className="absolute top-0 left-0 right-0 h-px bg-slate-300" 
                         style={{ 
                           left: 'calc(2rem)', // Approximation of half first child
                           right: 'calc(2rem)' // Approximation of half last child
                         }}
                    ></div>
                 </div>
              )}
              
              {/* Better Approach: Draw lines relative to children */}
              {node.children!.length > 1 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px">
                   <div className="absolute top-0 h-px bg-slate-300 left-0 right-0"></div>
                </div>
              )}

              <div className="absolute top-0 left-4 right-4 h-px bg-slate-300"></div>

              {node.children!.map((child, idx) => (
                <div key={idx} className="flex flex-col items-center relative">
                  {/* Vertical line from horizontal bar to child */}
                  <div className="h-4 w-px bg-slate-300 -mt-4 mb-2 relative"></div>
                  <NodeItem node={child} />
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export const MindMapViewer: React.FC<MindMapViewerProps> = ({ data }) => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const handleReset = () => setZoom(1);

  return (
    <div className="w-full bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[500px]">
      
      <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500 px-4">
         <span className="font-bold text-slate-600">Vista Jerárquica</span>
         
         <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-lg border border-slate-300 shadow-sm p-0.5">
              <button 
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                title="Alejar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              
              <button 
                onClick={handleReset}
                className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 min-w-[3rem] text-center hover:bg-slate-50 rounded"
                title="Resetear Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button 
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                title="Acercar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-8 cursor-grab active:cursor-grabbing relative bg-slate-50/50">
         <div 
           className="w-fit min-w-full flex justify-center transition-transform duration-200 origin-top"
           style={{ transform: `scale(${zoom})` }}
         >
            <NodeItem node={data} isRoot={true} />
         </div>
      </div>
    </div>
  );
};