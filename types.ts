export interface SemanticField {
  keyword: string;
  relevance: string;
}

export interface SectionAnalysis {
  title: string;
  originalComplexity: string;
  feynmanExplanation: string;
  semanticField: string[];
  keyInsight: string;
  supplementaryInfo?: string[]; // New field for technical/omitted details
}

export interface ThesisAnalysis {
  thesisTitle: string;
  generalSummary: string;
  author?: string;
  sections: SectionAnalysis[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // For subfolders
  createdAt: number;
}

export interface AnalysisVersion {
  id: string;
  timestamp: number;
  data: ThesisAnalysis;
  note: string; // e.g. "Versión original", "Actualización V2"
}

export interface StoredAnalysis extends ThesisAnalysis {
  id: string;
  folderId: string;
  createdAt: number;
  fileName: string;
  history: AnalysisVersion[]; // Array of past versions
}

export interface MindMapNode {
  label: string;
  description?: string; // Brief definition for tooltip
  children?: MindMapNode[];
}

export type DiagramType = 'cycle' | 'process' | 'comparison' | 'hierarchy' | 'analogy' | 'quadrant';

export interface DiagramItem {
  label: string;
  detail: string;
  icon?: string; // Optional emoji or icon name
}

export interface DiagramData {
  type: DiagramType;
  title: string;
  description: string;
  items?: DiagramItem[]; // Changed to optional
  comparisonData?: { // Only for 'comparison'
    leftTitle: string;
    rightTitle: string;
    leftItems: string[];
    rightItems: string[];
  };
  analogyData?: { // Only for 'analogy'
    sourceConcept: string; // e.g. "Water Flow"
    targetConcept: string; // e.g. "Electricity"
    mapping: { source: string; target: string; explanation: string }[];
  };
  quadrantData?: { // Only for 'quadrant'
    xAxisLabel: string;
    yAxisLabel: string;
    quadrants: {
      label: string;
      items: string[];
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    }[];
  };
}

// --- GAMIFICATION TYPES ---

export type GameType = 'clicker' | 'drag_drop' | 'quiz' | 'simulation' | 'memory' | 'sequence';

export interface GameElement {
  id: string;
  label: string;
  emoji: string;
  x?: number; // Initial Position X (0-100%)
  y?: number; // Initial Position Y (0-100%)
  role: 'target' | 'obstacle' | 'player' | 'dropzone' | 'draggable';
  color?: string; // Tailwind color class e.g. "bg-red-500"
}

export interface GameData {
  type: GameType;
  title: string;
  instructions: string;
  elements?: GameElement[]; // Optional for some game types
  winCondition?: string; // e.g. "Score > 10" or "All targets clicked"
  
  // Specific Data Structures
  quizData?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  
  memoryData?: {
    pairs: { 
      id: string; 
      content: string; // Text to display on card
      type: 'concept' | 'definition';
      matchId: string; // ID of the corresponding card
    }[];
  };

  sequenceData?: {
    items: {
      id: string;
      content: string;
      correctIndex: number; // 0-based index for correct order
    }[];
  };

  simulationData?: {
    variables: {
      id: string;
      label: string;
      min: number;
      max: number;
      defaultValue: number;
    }[];
    outcome: {
      label: string;
      formula: string;
      visualType: 'bar' | 'size' | 'speed';
    };
  };
}

export interface AppSettings {
  userName: string;
  themeColor: 'indigo' | 'emerald' | 'rose';
  detailLevel: 'concise' | 'detailed';
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  SETTINGS = 'SETTINGS'
}