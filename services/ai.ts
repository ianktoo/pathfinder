import { GoogleGenAI } from "@google/genai";
import { ModelID } from "../types/index";

export abstract class BaseLLM {
  abstract invoke(prompt: string, schema?: any): Promise<string>;
}

export class GeminiProvider extends BaseLLM {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string) {
    super();
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  async invoke(prompt: string, schema?: any): Promise<string> {
    const config: any = {
      responseMimeType: schema ? 'application/json' : 'text/plain',
    };

    if (schema) {
      config.responseSchema = schema;
    }

    const response = await this.ai.models.generateContent({
      model: this.modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: config
    });

    return response.text || '';
  }
}

export class PromptTemplate {
  constructor(private template: string) { }

  format(variables: Record<string, string>): string {
    return this.template.replace(/\{(\w+)\}/g, (_, key) => variables[key] || '');
  }
}

export class RunnableSequence {
  constructor(private template: PromptTemplate, private model: BaseLLM, private schema?: any) { }

  async invoke(variables: Record<string, string>): Promise<any> {
    const prompt = this.template.format(variables);
    const result = await this.model.invoke(prompt, this.schema);

    // helper to strip markdown code blocks
    const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim();

    return this.schema ? JSON.parse(cleanResult) : cleanResult;
  }
}

// Helper to safely access environment variables in Vite or Node
const getEnv = (key: string): string | undefined => {
  // @ts-ignore
  const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
  const processEnv = typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  return viteEnv || processEnv;
};

export const ModelRegistry = {
  currentModelId: (getEnv('VITE_GEMINI_MODEL') || 'gemini-1.5-flash-001') as ModelID,

  getProvider: (): BaseLLM => {
    const apiKey = getEnv('VITE_GEMINI_API_KEY') || '';

    if (!apiKey) {
      console.warn("Gemini API Key is missing. Check .env file.");
    }
    return new GeminiProvider(apiKey, ModelRegistry.currentModelId);
  },

  setModel: (id: ModelID) => {
    ModelRegistry.currentModelId = id;
    localStorage.setItem('preferred_model', id);
  },

  hasApiKey: (): boolean => {
    const key = getEnv('VITE_GEMINI_API_KEY');
    return !!key && key.length > 0;
  },

  init: () => {
    const saved = localStorage.getItem('preferred_model') as ModelID;
    const validModels: ModelID[] = ['gemini-1.5-flash-001', 'gemini-1.5-pro-001', 'gemini-2.0-flash-exp'];

    if (saved && validModels.includes(saved)) {
      ModelRegistry.currentModelId = saved;
    } else {
      // Fallback or override invalid defaults
      ModelRegistry.currentModelId = (getEnv('VITE_GEMINI_MODEL') || 'gemini-1.5-flash-001') as ModelID;
    }
  }
};