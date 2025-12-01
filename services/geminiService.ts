import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ThesisAnalysis, MindMapNode, DiagramData, GameData, GameType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SCHEMA DEFINITIONS ---

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    thesisTitle: { type: Type.STRING, description: "El título principal del documento o tema." },
    author: { type: Type.STRING, description: "El autor del documento si está disponible." },
    generalSummary: { type: Type.STRING, description: "Un resumen ejecutivo conciso de todo el documento." },
    sections: {
      type: Type.ARRAY,
      description: "Análisis de las secciones principales del documento.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Título de la sección, capítulo o subtema." },
          originalComplexity: { type: Type.STRING, description: "Nivel de complejidad técnica original (Baja, Media, Alta)." },
          feynmanExplanation: { 
            type: Type.STRING, 
            description: "CRUCIAL: Una explicación narrativa basada 100% en una ANALOGÍA del mundo real (cocina, deportes, casa). Debe explicar el 'qué es' y 'cómo funciona' sin usar jerga técnica. Ejemplo: 'Imagina que el voltaje es la presión del agua en una manguera...'" 
          },
          semanticField: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de 5-7 palabras clave o conceptos relacionados."
          },
          keyInsight: { type: Type.STRING, description: "La idea central o 'insight' más importante de esta sección en una frase." },
          supplementaryInfo: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de 3-5 detalles técnicos importantes, fórmulas matemáticas, fechas exactas, nombres de autores citados o matices académicos específicos que se eliminaron de la explicación simple para no perder rigor."
          }
        },
        required: ["title", "feynmanExplanation", "semanticField", "keyInsight", "originalComplexity", "supplementaryInfo"]
      }
    }
  },
  required: ["thesisTitle", "generalSummary", "sections"]
};

const mindMapSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    label: { type: Type.STRING, description: "El concepto central de esta rama." },
    description: { type: Type.STRING, description: "Definición muy breve (10 palabras) de este concepto." },
    children: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          description: { type: Type.STRING },
          children: {
             type: Type.ARRAY,
             items: {
               type: Type.OBJECT,
               properties: { 
                 label: { type: Type.STRING },
                 description: { type: Type.STRING }
               } 
             }
          }
        },
        required: ["label", "children"]
      }
    }
  },
  required: ["label", "children"]
};

const diagramSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { 
      type: Type.STRING, 
      enum: ['cycle', 'process', 'comparison', 'hierarchy', 'analogy', 'quadrant'],
      description: "El tipo de gráfico que mejor explica este concepto." 
    },
    title: { type: Type.STRING, description: "Título creativo del gráfico." },
    description: { type: Type.STRING, description: "Breve descripción de qué representa el gráfico." },
    items: {
      type: Type.ARRAY,
      description: "Items para Cycle, Process o Hierarchy. Dejar vacío si se usa comparison, analogy o quadrant.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Etiqueta corta del paso o nodo." },
          detail: { type: Type.STRING, description: "Explicación muy breve (máximo 15 palabras)." },
          icon: { type: Type.STRING, description: "Un solo emoji." }
        },
        required: ["label", "detail"]
      }
    },
    comparisonData: {
      type: Type.OBJECT,
      description: "Solo llenar si type es 'comparison'",
      properties: {
        leftTitle: { type: Type.STRING },
        rightTitle: { type: Type.STRING },
        leftItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        rightItems: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    analogyData: {
      type: Type.OBJECT,
      description: "Solo llenar si type es 'analogy'",
      properties: {
        sourceConcept: { type: Type.STRING, description: "Concepto conocido (ej: Tuberías de agua)" },
        targetConcept: { type: Type.STRING, description: "Concepto académico (ej: Corriente eléctrica)" },
        mapping: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              target: { type: Type.STRING },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    },
    quadrantData: {
      type: Type.OBJECT,
      description: "Solo llenar si type es 'quadrant' (Matriz 2x2).",
      properties: {
        xAxisLabel: { type: Type.STRING, description: "Etiqueta Eje X (ej: Urgencia)" },
        yAxisLabel: { type: Type.STRING, description: "Etiqueta Eje Y (ej: Importancia)" },
        quadrants: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Nombre del cuadrante (ej: Hacer ahora)" },
              items: { type: Type.ARRAY, items: { type: Type.STRING } },
              position: { type: Type.STRING, enum: ['top-right', 'top-left', 'bottom-right', 'bottom-left'] }
            }
          }
        }
      }
    }
  },
  required: ["type", "title", "description"] 
};

const gameSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['clicker', 'drag_drop', 'quiz', 'simulation', 'memory', 'sequence'], description: "Tipo de interacción." },
    title: { type: Type.STRING, description: "Nombre divertido del juego." },
    instructions: { type: Type.STRING, description: "Instrucciones cortas para el usuario." },
    elements: {
      type: Type.ARRAY,
      description: "Solo para clicker o drag_drop.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          emoji: { type: Type.STRING },
          role: { type: Type.STRING, enum: ['target', 'obstacle', 'player', 'dropzone', 'draggable'] },
          color: { type: Type.STRING, description: "Clase de color Tailwind (ej: bg-red-500)." }
        },
        required: ["id", "label", "emoji", "role"]
      }
    },
    quizData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    },
    memoryData: {
      type: Type.OBJECT,
      description: "Solo para type 'memory'.",
      properties: {
        pairs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              content: { type: Type.STRING, description: "Concepto o Definición" },
              type: { type: Type.STRING, enum: ['concept', 'definition'] },
              matchId: { type: Type.STRING, description: "El ID del par correspondiente" }
            },
            required: ["id", "content", "type", "matchId"]
          }
        }
      }
    },
    sequenceData: {
      type: Type.OBJECT,
      description: "Solo para type 'sequence'.",
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              content: { type: Type.STRING },
              correctIndex: { type: Type.INTEGER, description: "0-based correct order" }
            },
            required: ["id", "content", "correctIndex"]
          }
        }
      }
    },
    simulationData: {
      type: Type.OBJECT,
      description: "Solo para type 'simulation'.",
      properties: {
        variables: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING },
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER },
              defaultValue: { type: Type.NUMBER }
            }
          }
        },
        outcome: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, description: "Qué cambia (ej: Precio Total)" },
            formula: { type: Type.STRING, description: "Descripción de la relación (ej: var1 * var2)" },
            visualType: { type: Type.STRING, enum: ['bar', 'size', 'speed'], description: "Cómo visualizar el cambio" }
          }
        }
      }
    }
  },
  required: ["type", "title", "instructions"]
};

// --- HELPER TO CLEAN JSON ---
const cleanJsonString = (str: string): string => {
  // Remove markdown code blocks if present
  let cleaned = str.replace(/```json\n/g, '').replace(/```/g, '');
  return cleaned.trim();
};

// --- API CALLS ---

export const analyzeThesisPdf = async (base64Pdf: string, includeDeepAnalysis: boolean = true): Promise<ThesisAnalysis> => {
  try {
    const modelId = "gemini-2.5-flash"; 

    // Adjust prompt based on complexity requirement
    const systemInstruction = includeDeepAnalysis 
      ? `Eres el mejor comunicador científico del mundo (estilo Richard Feynman). Explica conceptos usando analogías brillantes. Se creativo y detallado.`
      : `Eres un analista técnico eficiente. Resume los conceptos clave de forma directa y concisa sin adornos.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [
          { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
          {
            text: `Analiza el PDF adjunto.
            
            ${systemInstruction}
            
            Requerimientos:
            1. Analiza cada sección importante.
            2. Genera un Resumen General.
            3. Extrae campos semánticos.
            4. ${includeDeepAnalysis ? 'Provee una explicación Feynman con analogías ricas.' : 'Provee una explicación simple y directa.'}
            5. Extrae datos técnicos importantes (supplementary info).

            Devuelve JSON válido estrictamente según el esquema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: includeDeepAnalysis ? 0.45 : 0.2, 
      }
    });

    const textResponse = cleanJsonString(response.text || "");
    if (!textResponse) throw new Error("No response generated");

    return JSON.parse(textResponse) as ThesisAnalysis;

  } catch (error) {
    console.error("Error analyzing PDF:", error);
    throw error;
  }
};

export const fetchVideoContextWithAI = async (url: string): Promise<string | null> => {
  try {
    // We use the search tool to find info about the video since we can't scrape it client-side
    const modelId = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{ text: `Busca y proporciona un resumen detallado o la transcripción aproximada del video de YouTube con esta URL: ${url}. Si encuentras el contenido, devuélvelo como texto plano para análisis.` }]
      },
      config: {
        tools: [{ googleSearch: {} }] // Enable search to find the video content
      }
    });
    
    // Check if we got useful text
    if (response.text && response.text.length > 100) {
      return response.text;
    }
    return null;
  } catch (e) {
    console.warn("Could not fetch video context via AI", e);
    return null;
  }
};

export const analyzeTranscript = async (transcript: string, title?: string, includeDeepAnalysis: boolean = true): Promise<ThesisAnalysis> => {
  try {
    const modelId = "gemini-2.5-flash";

    const promptText = `Analiza la siguiente transcripción de video:
    TÍTULO: "${title || 'Tema del Video'}"
    
    TRANSCRIPCIÓN:
    "${transcript.substring(0, 50000)}" 
    
    ${includeDeepAnalysis 
      ? 'Usa el Método Feynman con analogías creativas y explicaciones ricas.' 
      : 'Sé conciso, directo y técnico.'}

    TU TAREA:
    1. Segmenta en capítulos lógicos.
    2. Para cada sección: Título, Explicación (Simple o Feynman), Campo Semántico, Insight Clave, Datos Técnicos.
    3. Resumen General.

    Devuelve JSON válido estrictamente según el esquema.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{ text: promptText }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: includeDeepAnalysis ? 0.45 : 0.2,
      }
    });

    const textResponse = cleanJsonString(response.text || "");
    if (!textResponse) throw new Error("No response generated");

    return JSON.parse(textResponse) as ThesisAnalysis;

  } catch (error) {
    console.error("Error analyzing Transcript:", error);
    throw error;
  }
};

export const generateMindMapData = async (title: string, context: string): Promise<MindMapNode> => {
  try {
     const modelId = "gemini-2.5-flash";
     const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{
          text: `Genera una estructura de mapa mental jerárquico (JSON) para: "${title}".
          Contexto: "${context}".
          
          REGLAS:
          1. Título como raíz.
          2. MÍNIMO 3 ramas principales.
          3. MÍNIMO 2 niveles de profundidad (nietos).
          4. OBLIGATORIO: Incluye una 'description' breve para CADA nodo.
          
          JSON Estricto.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: mindMapSchema,
        temperature: 0.4,
      }
     });

     const textResponse = cleanJsonString(response.text || "");
     return JSON.parse(textResponse) as MindMapNode;
  } catch (error) {
    console.error("Error generating mind map:", error);
    throw error;
  }
}

export const generateDiagramData = async (title: string, context: string): Promise<DiagramData> => {
  try {
    const modelId = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{
          text: `Diseña un gráfico visual para explicar: "${title}".
          Contexto: "${context}".
          
          Elige inteligentemente entre: cycle, process, comparison, hierarchy, analogy, quadrant.
          NO uses siempre el mismo.
          
          Devuelve JSON válido.`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: diagramSchema,
        temperature: 0.3, 
      }
    });

    const textResponse = cleanJsonString(response.text || "");
    return JSON.parse(textResponse) as DiagramData;
  } catch (error) {
    console.error("Error generating diagram:", error);
    throw error;
  }
}

export const generateGamificationData = async (title: string, context: string, preferredType?: GameType): Promise<GameData> => {
  try {
    const modelId = "gemini-2.5-flash";
    
    let promptInstruction = `Gamifica este concepto académico: "${title}". Contexto: "${context}".`;
    
    if (preferredType) {
      promptInstruction += `\nUSUARIO ELIGIÓ TIPO: '${preferredType}'. Genera JSON para este tipo específico.`;
    } else {
      promptInstruction += `\nElige el mejor tipo de juego (quiz, simulation, sequence, memory) basado en el contenido.`;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{ text: promptInstruction }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: gameSchema,
        temperature: 0.7, 
      }
    });
    
    const textResponse = cleanJsonString(response.text || "");
    return JSON.parse(textResponse) as GameData;
  } catch (error) {
    console.error("Error generating game:", error);
    throw error;
  }
}
