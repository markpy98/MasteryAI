import { Folder, StoredAnalysis, ThesisAnalysis, AppSettings, AnalysisVersion } from "../types";

const FOLDERS_KEY = 'mastery_folders';
const DOCS_KEY = 'mastery_docs';
const SETTINGS_KEY = 'mastery_settings';

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// --- Settings ---

export const getSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Error reading settings", e);
  }
  return {
    userName: 'Estudiante',
    themeColor: 'indigo',
    detailLevel: 'detailed'
  };
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving settings", e);
  }
};

// --- Folders ---

export const getFolders = (): Folder[] => {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    if (!stored) {
      const defaultFolder: Folder = { id: 'default', name: 'General', parentId: null, createdAt: Date.now() };
      localStorage.setItem(FOLDERS_KEY, JSON.stringify([defaultFolder]));
      return [defaultFolder];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error getting folders", e);
    // Recover default
    const defaultFolder: Folder = { id: 'default', name: 'General', parentId: null, createdAt: Date.now() };
    return [defaultFolder];
  }
};

export const createFolder = (name: string, parentId: string | null = null): Folder => {
  const folders = getFolders();
  const newFolder: Folder = { id: generateId(), name, parentId, createdAt: Date.now() };
  folders.push(newFolder);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  return newFolder;
};

// --- Documents ---

export const getDocuments = (): StoredAnalysis[] => {
  try {
    const stored = localStorage.getItem(DOCS_KEY);
    if (!stored) return [];
    
    let docs: StoredAnalysis[] = JSON.parse(stored);
    
    if (!Array.isArray(docs)) {
        console.warn("Storage corrupted, resetting docs array");
        return [];
    }

    // Migration for old data
    docs = docs.map(doc => {
      if (!doc.history) {
        return {
          ...doc,
          history: [{
            id: generateId(),
            timestamp: doc.createdAt,
            data: {
              thesisTitle: doc.thesisTitle,
              generalSummary: doc.generalSummary,
              author: doc.author,
              sections: doc.sections
            },
            note: 'Versión Original'
          }]
        };
      }
      return doc;
    });
    
    return docs;
  } catch (e) {
    console.error("Error getting documents", e);
    return [];
  }
};

export const getDocumentsByFolder = (folderId: string): StoredAnalysis[] => {
  const docs = getDocuments();
  return docs.filter(d => d.folderId === folderId).sort((a, b) => b.createdAt - a.createdAt);
};

export const saveAnalysis = (analysis: ThesisAnalysis, folderId: string, fileName: string): StoredAnalysis => {
  const docs = getDocuments();
  
  const existingDocIndex = docs.findIndex(d => d.folderId === folderId && d.fileName === fileName);

  if (existingDocIndex !== -1) {
    // UPDATE EXISTING
    const existingDoc = docs[existingDocIndex];
    const newVersion: AnalysisVersion = {
      id: generateId(),
      timestamp: Date.now(),
      data: analysis,
      note: `Revisión ${existingDoc.history.length + 1}`
    };

    const updatedDoc: StoredAnalysis = {
      ...existingDoc,
      ...analysis,
      createdAt: Date.now(),
      history: [newVersion, ...existingDoc.history]
    };

    docs[existingDocIndex] = updatedDoc;
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
    return updatedDoc;

  } else {
    // CREATE NEW
    const newVersion: AnalysisVersion = {
      id: generateId(),
      timestamp: Date.now(),
      data: analysis,
      note: 'Versión Original'
    };

    const newDoc: StoredAnalysis = {
      ...analysis,
      id: generateId(),
      folderId,
      fileName,
      createdAt: Date.now(),
      history: [newVersion]
    };

    docs.unshift(newDoc);
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
    return newDoc;
  }
};

export const moveDocument = (docId: string, targetFolderId: string): StoredAnalysis[] => {
  const docs = getDocuments();
  const updatedDocs = docs.map(doc => 
    doc.id === docId ? { ...doc, folderId: targetFolderId } : doc
  );
  localStorage.setItem(DOCS_KEY, JSON.stringify(updatedDocs));
  return updatedDocs;
};

export const deleteDocument = (docId: string) => {
  const docs = getDocuments();
  const filtered = docs.filter(d => d.id !== docId);
  localStorage.setItem(DOCS_KEY, JSON.stringify(filtered));
};

// --- Backup / Interoperability ---

export const exportAllData = (): string => {
  const data = {
    folders: getFolders(),
    documents: getDocuments(),
    settings: getSettings(),
    version: 1,
    exportedAt: Date.now()
  };
  return JSON.stringify(data, null, 2);
};

export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.folders || !data.documents) {
      throw new Error("Formato de archivo inválido");
    }
    
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(data.folders));
    localStorage.setItem(DOCS_KEY, JSON.stringify(data.documents));
    if (data.settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    }
    return true;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};

export const importSingleDocument = (jsonString: string): StoredAnalysis | null => {
  try {
    const doc = JSON.parse(jsonString) as StoredAnalysis;
    
    if (!doc.thesisTitle || !doc.sections) {
      throw new Error("El archivo no es un análisis válido.");
    }

    const docs = getDocuments();
    let finalDoc = { ...doc };
    
    // Avoid ID collisions if importing into a new environment
    if (docs.some(d => d.id === finalDoc.id)) {
      finalDoc.id = generateId();
      finalDoc.thesisTitle = `${finalDoc.thesisTitle} (Importado)`;
      finalDoc.createdAt = Date.now();
    }

    // Validate folder
    const folders = getFolders();
    if (!folders.some(f => f.id === finalDoc.folderId)) {
      finalDoc.folderId = 'default';
    }

    docs.unshift(finalDoc);
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
    return finalDoc;
  } catch (e) {
    console.error("Failed to import single document", e);
    return null;
  }
};