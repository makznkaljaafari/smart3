
import { supabase } from './supabaseClient';
import { GoogleGenAI } from '@google/genai';
import { config } from './config';

/**
 * Securely calls the Gemini API via Supabase Edge Function ('gemini-proxy').
 * If the proxy fails (e.g., local dev without functions, network error, or 404/500),
 * it gracefully falls back to client-side execution using the key from config.ts.
 * 
 * @param prompt The text prompt to send to the model.
 * @param modelConfig Additional configuration (model name, temperature, etc).
 * @returns The generated text string, or null if failed.
 */
export const callAIProxy = async (prompt: string, modelConfig: any = {}) => {
  const modelName = modelConfig.model || 'gemini-2.5-flash';

  // 1. Try Supabase Edge Function (Proxy)
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        model: modelName,
        contents: prompt, 
        config: modelConfig
      }
    });

    if (error) {
      console.warn("AI Proxy returned error:", error);
      throw error; // Throw to trigger fallback
    }
    
    // Check if the function actually returned data structure we expect
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    
    // If data structure is missing but no error thrown, throw manual error
    throw new Error("Invalid response structure from Proxy");

  } catch (proxyError) {
    console.warn("AI Proxy Failed, switching to Client Fallback...", proxyError);
    
    // 2. Fallback: Direct Client-Side Call
    if (config.gemini.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: modelConfig
        });
        return response.text || '';
      } catch (clientError) {
        console.error("AI Client Fallback Failed:", clientError);
      }
    } else {
        console.error("AI Generation Failed: Proxy failed and no API Key available for fallback in config.");
    }
  }
  return null;
};

/**
 * Calls the AI Proxy with a structured content object (e.g. for images + text).
 * Use this when you need to send 'inlineData' or chat history.
 */
export const callAIProxyStructured = async (contents: any[], modelConfig: any = {}) => {
  const modelName = modelConfig.model || 'gemini-2.5-flash';

  // 1. Try Supabase Edge Function (Proxy)
  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        model: modelName,
        contents: contents,
        config: modelConfig
      }
    });

    if (error) throw error;
    
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error("Invalid response structure from Proxy");

  } catch (proxyError) {
    console.warn("AI Proxy Structure Error (falling back to client):", proxyError);

    // 2. Fallback: Direct Client-Side Call
    if (config.gemini.apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents as any, // Cast to any to satisfy overload
            config: modelConfig
          });
          return response.text || '';
        } catch (clientError) {
          console.error("AI Client Fallback Failed:", clientError);
        }
    } else {
        console.error("AI Generation Failed: No API Key available for fallback.");
    }
  }
  return null;
};

// Helper to clean JSON strings returned by LLMs (often wrapped in ```json ... ```)
export const cleanJsonString = (text: string): string => {
  if (!text) return '{}';
  let cleaned = text.trim();
  
  // 1. Extract from Markdown code block if present (more robust)
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // Basic cleanup if no code block found
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
  }
  
  // 2. Find outermost braces to handle trailing/leading text
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let start = -1;
  let end = -1;
  
  // Determine if we are looking for an object or array
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
      start = firstBracket;
      end = cleaned.lastIndexOf(']');
  }

  if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
  }

  // 3. Remove trailing commas before closing braces/brackets (Common LLM error)
  // Regex looks for a comma followed by whitespace and then a closing brace or bracket
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  return cleaned;
};
