import React from 'react';
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
  return (
    <div className="w-full bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[500px]">
      
      <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500 px-4">
         <span>Vista Jerárquica</span>
         <span className="flex items-center gap-1">
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
           Scroll para explorar / Hover para detalles
         </span>
      </div>

      <div className="flex-1 overflow-auto p-8 cursor-grab active:cursor-grabbing relative">
         <div className="w-fit min-w-full flex justify-center">
            <NodeItem node={data} isRoot={true} />
         </div>
      </div>
    </div>
  );
};