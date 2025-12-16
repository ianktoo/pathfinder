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
      contents: prompt,
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
    return this.schema ? JSON.parse(result) : result;
  }
}

export const ModelRegistry = {
  currentModelId: 'gemini-1.5-flash' as ModelID,

  getProvider: (): BaseLLM => {
    // Check both standard process.env and Vite's import.meta.env
    const envKey = process.env.VITE_GEMINI_API_KEY;
    // @ts-ignore
    const viteKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined;

    const apiKey = envKey || viteKey || '';

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
    // Check both standard process.env and Vite's import.meta.env
    const envKey = process.env.VITE_GEMINI_API_KEY;

    console.log("Gemini API Key:", envKey);
    // @ts-ignore
    const viteKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : undefined;

    const key = envKey || viteKey;

    console.log("Gemini API Key (final):", key);
    return !!key && key.length > 0;
  },

  init: () => {
    const saved = localStorage.getItem('preferred_model') as ModelID;
    const validModels: ModelID[] = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'];

    if (saved && validModels.includes(saved)) {
      ModelRegistry.currentModelId = saved;
    } else {
      // Fallback or override invalid defaults
      ModelRegistry.currentModelId = 'gemini-1.5-flash';
    }
  }
};