import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'en', history = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompts: Record<string, string> = {
      en: `You are KrishiMitra, a helpful AI assistant for Indian farmers. Provide practical, actionable advice on:
      - Crop cultivation and best practices
      - Pest and disease management
      - Soil health and fertilization
      - Irrigation and water management
      - Weather-related farming decisions
      - Government schemes and subsidies
      
      Keep responses concise (2-4 sentences), use simple language, and focus on solutions available to small and marginal farmers. Prioritize organic and sustainable methods when possible.`,
      hi: `आप कृषिमित्र हैं, भारतीय किसानों के लिए एक सहायक AI सहायक। व्यावहारिक सलाह दें:
      - फसल की खेती और सर्वोत्तम तरीके
      - कीट और रोग प्रबंधन
      - मिट्टी स्वास्थ्य और उर्वरक
      - सिंचाई और पानी प्रबंधन
      - मौसम से संबंधित खेती के फैसले
      - सरकारी योजनाएं और सब्सिडी
      
      संक्षिप्त (2-4 वाक्य) जवाब दें, सरल भाषा का उपयोग करें, और छोटे किसानों के लिए उपलब्ध समाधानों पर ध्यान दें। जैविक और टिकाऊ तरीकों को प्राथमिकता दें।`,
    };

    // Build conversation history
    const messages = [
      {
        role: 'system',
        content: systemPrompts[language] || systemPrompts.en,
      },
      ...history,
      {
        role: 'user',
        content: message,
      },
    ];

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save to database
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        await supabaseClient.from('chat_messages').insert({
          user_id: user.id,
          message,
          response: aiResponse,
          language,
        });
      }
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in chat-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
