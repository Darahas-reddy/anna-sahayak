import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI for image analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural AI assistant specializing in crop disease detection for Indian farmers. 
            Analyze crop images and provide:
            1. Disease name (if any)
            2. Confidence level (0-100)
            3. Practical remedies using locally available materials
            4. Preventive measures
            Keep responses concise and actionable. Focus on safe, organic solutions first.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this crop image and identify any diseases or issues. Provide the disease name, confidence level, and 3-5 practical remedies suitable for Indian farmers.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the AI response
    const diseaseMatch = content.match(/disease[:\s]+([^\n.]+)/i);
    const confidenceMatch = content.match(/confidence[:\s]+(\d+)/i);
    
    // Extract remedies (lines that start with numbers or bullets)
    const remedies = content
      .split('\n')
      .filter((line: string) => /^[\d\-•*]/.test(line.trim()))
      .map((line: string) => line.replace(/^[\d\-•*.\s]+/, '').trim())
      .filter((line: string) => line.length > 10);

    return new Response(
      JSON.stringify({
        disease: diseaseMatch ? diseaseMatch[1].trim() : 'No disease detected',
        confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 85,
        remedies: remedies.length > 0 ? remedies : [
          'Apply neem oil spray (20ml per liter of water)',
          'Remove affected leaves immediately',
          'Ensure proper spacing between plants for air circulation',
          'Water in the morning to reduce humidity',
        ],
        fullAnalysis: content,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in detect-disease:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
