import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cropName, fieldSize, soilType, lastYield, plantingDate, location } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an agricultural AI specialist helping Indian farmers predict crop yields. 
    Analyze the provided data and provide a realistic yield prediction with confidence level and key factors.
    Consider: soil conditions, historical yields, planting timing, field size, and regional climate patterns.
    Respond in JSON format with: predicted_yield (in quintals), confidence_level (0-100), and factors (array of key influencing factors).`;

    const userPrompt = `Predict the yield for:
    - Crop: ${cropName}
    - Field Size: ${fieldSize} acres
    - Soil Type: ${soilType}
    - Last Yield: ${lastYield} quintals
    - Planting Date: ${plantingDate}
    - Location: ${location}
    
    Provide a detailed prediction with factors affecting the yield.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "predict_yield",
              description: "Generate yield prediction with confidence and factors",
              parameters: {
                type: "object",
                properties: {
                  predicted_yield: { type: "number" },
                  confidence_level: { type: "number" },
                  factors: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["predicted_yield", "confidence_level", "factors"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "predict_yield" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls[0];
    const prediction = JSON.parse(toolCall.function.arguments);

    // Store prediction in database
    const authHeader = req.headers.get('authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from('yield_predictions').insert({
        user_id: user.id,
        crop_name: cropName,
        predicted_yield: prediction.predicted_yield,
        confidence_level: prediction.confidence_level,
        factors: { factors: prediction.factors },
        prediction_date: new Date().toISOString().split('T')[0],
        expected_harvest_date: plantingDate
      });
    }

    return new Response(
      JSON.stringify(prediction),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predict-yield:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
