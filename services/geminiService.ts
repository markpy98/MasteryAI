import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ThesisAnalysis, MindMapNode, DiagramData, GameData, GameType } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_BUILD' });

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

export const analyzeThesisPdf = async (base64Pdf: string): Promise<ThesisAnalysis> => {
  try {
    const modelId = "gemini-2.5-flash"; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [
          { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
          {
            text: `Eres el mejor comunicador científico del mundo (estilo Richard Feynman). Tu habilidad única es explicar conceptos de maestría usando analogías brillantes y cotidianas que cualquiera puede entender.
            
            Analiza el PDF adjunto. Para cada sección importante:
            
            1. **Entiende la esencia técnica:** ¿Qué está diciendo realmente el autor?
            2. **TRADUCCIÓN FEYNMAN (Lo más importante):** 
               - Olvida el lenguaje académico. Háblale al usuario como si fuera un amigo curioso.
               - **OBLIGATORIO:** Usa una ANALOGÍA concreta del mundo real en CADA explicación. 
               - Ejemplo: Si el tema es "Ancho de banda", explica: "Imagina una autopista. El ancho de banda es cuántos carriles tiene la autopista..."
               - Haz que la explicación sea visual y memorable.
            3. **Campo Semántico:** Extrae los conceptos clave.
            4. **Profundidad Académica (Lo que no se debe perder):** Extrae 3-5 puntos de datos duros, fórmulas, citas o definiciones técnicas precisas que simplificaste en la analogía. Esto sirve para que el estudiante tenga el dato exacto "de relleno" que no entró en el resumen.

            Devuelve JSON válido estrictamente según el esquema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.45, 
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

// NEW FUNCTION FOR TRANSCRIPT/TEXT ANALYSIS
export const analyzeTranscript = async (transcript: string, title?: string): Promise<ThesisAnalysis> => {
  try {
    const modelId = "gemini-2.5-flash";

    const promptText = `Eres el mejor comunicador científico del mundo (estilo Richard Feynman).
    
    Analiza la siguiente transcripción de video sobre un tema académico complejo:
    TÍTULO REFERENCIA: "${title || 'Tema del Video'}"
    
    TRANSCRIPCIÓN:
    "${transcript.substring(0, 50000)}" 
    (Nota: Si la transcripción es muy larga, enfócate en los puntos clave).

    TU TAREA:
    1. **Segmentación:** Como el texto puede ser continuo, divídelo lógicamente en "Secciones" o "Capítulos" basados en cambios de tema.
    2. **Análisis:** Para cada sección detectada, genera:
       - Título de la sección.
       - **TRADUCCIÓN FEYNMAN:** Explicación narrativa usando 100% ANALOGÍAS del mundo real.
       - Campo semántico.
       - Insight Clave.
       - Datos técnicos (supplementary info).
    
    3. Genera un Resumen General del video.

    Devuelve JSON válido estrictamente según el esquema proporcionado.`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{ text: promptText }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.45,
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
          text: `Genera una estructura de mapa mental jerárquico (JSON) para el siguiente tema académico:
          
          Título: "${title}"
          Contexto: "${context}"

          El mapa debe tener el Título como raíz.
          IMPORTANTE:
          - Debe tener AL MENOS 3 ramas principales (hijos de la raíz).
          - Cada rama principal debe tener AL MENOS 2 sub-ramas (nietos).
          - Usa palabras cortas para los labels.
          - Proporciona una 'description' breve (máx 12 palabras) para CADA nodo, explicando qué es el concepto.`
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
          text: `Eres un diseñador de información experto. Analiza el siguiente concepto académico y decide cuál es la MEJOR manera visual de representarlo.
          
          Concepto: "${title}"
          Explicación: "${context}"
          
          Tipos Disponibles (Elige UNO basándote en la naturaleza del contenido):
          - 'cycle': Procesos repetitivos o bucles.
          - 'process': Pasos lineales secuenciales.
          - 'comparison': Contrastes claros entre A y B.
          - 'hierarchy': Estructuras piramidales.
          - 'analogy': Metáforas del mundo real.
          - 'quadrant': Matrices 2x2 (e.g. Matriz Eisenhower, Riesgo/Impacto).`
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: diagramSchema,
        temperature: 0.3, 
        maxOutputTokens: 2000,
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
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: [{
          text: `Analiza este concepto académico: "${title}".
          Contexto: "${context}".
          
          Tu objetivo es GAMIFICAR este concepto para que el usuario aprenda interactuando.
          
          ${preferredType 
            ? `PREFERENCIA DE USUARIO: El usuario ha seleccionado explícitamente el tipo de juego: '${preferredType}'. OBLIGATORIO: Genera una estructura JSON válida estrictamente para type='${preferredType}'.`
            : `Elige el MEJOR tipo de juego. NO repitas siempre el mismo tipo. Analiza el contenido:
               - ¿Es un compromiso o balance? -> Usa 'simulation' (variables).
               - ¿Es una lista de pasos? -> Usa 'sequence'.
               - ¿Es vocabulario? -> Usa 'memory'.`
          }
          
          Tipos: memory, sequence, clicker, drag_drop, quiz, simulation.
          
          REGLAS:
          - NO USES URLs externas. Usa EMOJIS.
          - Instrucciones claras y cortas.`
        }]
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