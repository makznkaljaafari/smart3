
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "https://esm.sh/@google/genai@0.1.1";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    // Check if message exists
    if (!message || !message.chat || !message.text) {
      return new Response("No message content found", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text;
    
    // Environment Variables
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const geminiApiKey = Deno.env.get('API_KEY');

    if (!botToken) {
      console.error("Missing TELEGRAM_BOT_TOKEN");
      return new Response("Config Error", { status: 500 });
    }

    // Helper to send message to Telegram
    const sendReply = async (replyText: string) => {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: replyText })
      });
      return res.json();
    };

    // Handle Start Command
    if (text === '/start') {
        await sendReply(`مرحباً بك في المساعد المالي الذكي! 🤖\n\nأنا هنا لمساعدتك في إدارة أعمالك. يمكنك سؤالي عن:\n- حالة السوق\n- نصائح مالية\n- تلخيص بيانات\n\nلربط حسابك، استخدم Chat ID: ${chatId}`);
        return new Response("OK", { status: 200 });
    }

    // Check Gemini Key
    if (!geminiApiKey) {
       await sendReply("عذراً، مفتاح الذكاء الاصطناعي (API Key) غير مضبوط في إعدادات الخادم. يرجى مراجعة المسؤول.");
       return new Response("OK", { status: 200 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    
    const prompt = `
      You are "Smart Finance AI", a professional and helpful financial assistant bot for an ERP system.
      
      User Query: "${text}"
      
      Guidelines:
      1. Answer in Arabic strictly.
      2. Be concise, professional, and helpful.
      3. If the user asks for their Chat ID, provide: ${chatId}
      4. If the user asks about connecting to the app, guide them to 'Settings > Integrations'.
      5. Do not invent financial data. If you don't have context, give general advice.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const replyText = result.response?.text() || "عذراً، لم أتمكن من معالجة طلبك في الوقت الحالي.";

    await sendReply(replyText);

    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("Telegram Bot Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
