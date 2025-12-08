
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.1.1";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get API Key from Server Secrets
    const apiKey = Deno.env.get('API_KEY');
    if (!apiKey) {
      throw new Error('Missing API_KEY in Supabase Secrets');
    }

    // 2. Parse Request Body
    const { model, contents, config } = await req.json();

    if (!contents) {
      return new Response(
        JSON.stringify({ error: 'Missing "contents" in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });
    
    // Use the requested model or default to a stable fast model
    const modelName = model || 'gemini-2.5-flash';

    // 4. Generate Content
    const result = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: config || {}
    });

    // 5. Return Response
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Gemini Proxy Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error', details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
