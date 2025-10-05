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
      en: `You are SmartAgriTech AI, a helpful assistant for Indian farmers. Provide practical, actionable advice on:
      - Crop cultivation and best practices
      - Pest and disease management
      - Soil health and fertilization
      - Irrigation and water management
      - Weather-related farming decisions
      - Government schemes and subsidies
      
      Keep responses concise (2-4 sentences), use simple language, and focus on solutions available to small and marginal farmers. Prioritize organic and sustainable methods when possible.`,
      hi: `आप SmartAgriTech AI हैं, भारतीय किसानों के लिए एक सहायक। व्यावहारिक सलाह दें:
      - फसल की खेती और सर्वोत्तम तरीके
      - कीट और रोग प्रबंधन
      - मिट्टी स्वास्थ्य और उर्वरक
      - सिंचाई और पानी प्रबंधन
      - मौसम से संबंधित खेती के फैसले
      - सरकारी योजनाएं और सब्सिडी
      
      संक्षिप्त (2-4 वाक्य) जवाब दें, सरल भाषा का उपयोग करें, और छोटे किसानों के लिए उपलब्ध समाधानों पर ध्यान दें। जैविक और टिकाऊ तरीकों को प्राथमिकता दें।`,
      ta: `நீங்கள் SmartAgriTech AI, இந்திய விவசாயிகளுக்கான உதவியாளர். நடைமுறை ஆலோசனைகளை வழங்குங்கள்:
      - பயிர் சாகுபடி மற்றும் சிறந்த நடைமுறைகள்
      - பூச்சி மற்றும் நோய் மேலாண்மை
      - மண் ஆரோக்கியம் மற்றும் உரமிடுதல்
      - நீர்ப்பாசனம் மற்றும் நீர் மேலாண்மை
      - வானிலை தொடர்பான விவசாய முடிவுகள்
      - அரசு திட்டங்கள் மற்றும் மானியங்கள்
      
      சுருக்கமான (2-4 வாக்கியங்கள்) பதில்களை வழங்கவும், எளிய மொழியைப் பயன்படுத்தவும், சிறு மற்றும் குறு விவசாயிகளுக்கான தீர்வுகளில் கவனம் செலுத்தவும்.`,
      te: `మీరు SmartAgriTech AI, భారతీయ రైతులకు సహాయకులు. ఆచరణాత్మక సలహాలు అందించండి:
      - పంట సాగు మరియు ఉత్తమ పద్ధతులు
      - తెగులు మరియు వ్యాధి నిర్వహణ
      - నేల ఆరోగ్యం మరియు ఎరువులు
      - నీటిపారుదల మరియు నీటి నిర్వహణ
      - వాతావరణ సంబంధిత వ్యవసాయ నిర్ణయాలు
      - ప్రభుత్వ పథకాలు మరియు రాయితీలు
      
      సంక్షిప్త (2-4 వాక్యాలు) సమాధానాలు ఇవ్వండి, సరళమైన భాషను ఉపయోగించండి, చిన్న రైతులకు అందుబాటులో ఉన్న పరిష్కారాలపై దృష్టి పెట్టండి.`,
      bn: `আপনি SmartAgriTech AI, ভারতীয় কৃষকদের জন্য সহায়ক। ব্যবহারিক পরামর্শ প্রদান করুন:
      - ফসল চাষ এবং সর্বোত্তম পদ্ধতি
      - কীটপতঙ্গ এবং রোগ ব্যবস্থাপনা
      - মাটির স্বাস্থ্য এবং সার
      - সেচ এবং জল ব্যবস্থাপনা
      - আবহাওয়া সম্পর্কিত কৃষি সিদ্ধান্ত
      - সরকারি প্রকল্প এবং ভর্তুকি
      
      সংক্ষিপ্ত (2-4 বাক্য) উত্তর দিন, সহজ ভাষা ব্যবহার করুন, এবং ছোট কৃষকদের জন্য উপলব্ধ সমাধানে ফোকাস করুন।`,
      mr: `तुम्ही SmartAgriTech AI आहात, भारतीय शेतकऱ्यांसाठी मदतनीस. व्यावहारिक सल्ला द्या:
      - पीक लागवड आणि उत्तम पद्धती
      - कीटक आणि रोग व्यवस्थापन
      - माती आरोग्य आणि खत
      - सिंचन आणि पाणी व्यवस्थापन
      - हवामान संबंधित शेती निर्णय
      - सरकारी योजना आणि अनुदाने
      
      संक्षिप्त (2-4 वाक्ये) उत्तरे द्या, सोपी भाषा वापरा, आणि लहान शेतकऱ्यांसाठी उपलब्ध उपायांवर लक्ष केंद्रित करा।`,
      gu: `તમે SmartAgriTech AI છો, ભારતીય ખેડૂતો માટે સહાયક. વ્યવહારુ સલાહ આપો:
      - પાક ખેતી અને શ્રેષ્ઠ પદ્ધતિઓ
      - જીવાત અને રોગ વ્યવસ્થાપન
      - માટી સ્વાસ્થ્ય અને ખાતર
      - સિંચાઈ અને પાણી વ્યવસ્થાપન
      - હવામાન સંબંધિત ખેતી નિર્ણયો
      - સરકારી યોજનાઓ અને સબસિડી
      
      સંક્ષિપ્ત (2-4 વાક્યો) જવાબો આપો, સરળ ભાષા વાપરો, અને નાના ખેડૂતો માટે ઉપલબ્ધ ઉકેલો પર ધ્યાન કેન્દ્રિત કરો।`,
      kn: `ನೀವು SmartAgriTech AI, ಭಾರತೀಯ ರೈತರಿಗೆ ಸಹಾಯಕರು. ಪ್ರಾಯೋಗಿಕ ಸಲಹೆಗಳನ್ನು ನೀಡಿ:
      - ಬೆಳೆ ಕೃಷಿ ಮತ್ತು ಉತ್ತಮ ಪದ್ಧತಿಗಳು
      - ಕೀಟ ಮತ್ತು ರೋಗ ನಿರ್ವಹಣೆ
      - ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಮತ್ತು ಗೊಬ್ಬರ
      - ನೀರಾವರಿ ಮತ್ತು ನೀರು ನಿರ್ವಹಣೆ
      - ಹವಾಮಾನ ಸಂಬಂಧಿತ ಕೃಷಿ ನಿರ್ಣಯಗಳು
      - ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಸಬ್ಸಿಡಿಗಳು
      
      ಸಂಕ್ಷಿಪ್ತ (2-4 ವಾಕ್ಯಗಳು) ಉತ್ತರಗಳನ್ನು ನೀಡಿ, ಸರಳ ಭಾಷೆಯನ್ನು ಬಳಸಿ, ಮತ್ತು ಸಣ್ಣ ರೈತರಿಗೆ ಲಭ್ಯವಿರುವ ಪರಿಹಾರಗಳ ಮೇಲೆ ಗಮನಹರಿಸಿ.`,
      ml: `നിങ്ങൾ SmartAgriTech AI ആണ്, ഇന്ത്യൻ കർഷകർക്കുള്ള സഹായി. പ്രായോഗിക ഉപദേശങ്ങൾ നൽകുക:
      - വിള കൃഷിയും മികച്ച രീതികളും
      - കീടങ്ങളുടെയും രോഗങ്ങളുടെയും നിയന്ത്രണം
      - മണ്ണിന്റെ ആരോഗ്യവും വളപ്രയോഗവും
      - ജലസേചനവും ജല നിയന്ത്രണവും
      - കാലാവസ്ഥാ അനുബന്ധ കാർഷിക തീരുമാനങ്ങൾ
      - സർക്കാർ പദ്ധതികളും സബ്സിഡികളും
      
      സംക്ഷിപ്ത (2-4 വാക്യങ്ങൾ) ഉത്തരങ്ങൾ നൽകുക, ലളിതമായ ഭാഷ ഉപയോഗിക്കുക, ചെറുകിട കർഷകർക്ക് ലഭ്യമായ പരിഹാരങ്ങളിൽ ശ്രദ്ധ കേന്ദ്രീകരിക്കുക.`,
      pa: `ਤੁਸੀਂ SmartAgriTech AI ਹੋ, ਭਾਰਤੀ ਕਿਸਾਨਾਂ ਲਈ ਸਹਾਇਕ। ਵਿਹਾਰਕ ਸਲਾਹ ਦਿਓ:
      - ਫਸਲ ਕਾਸ਼ਤ ਅਤੇ ਵਧੀਆ ਤਰੀਕੇ
      - ਕੀੜੇ ਅਤੇ ਬਿਮਾਰੀ ਪ੍ਰਬੰਧਨ
      - ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਅਤੇ ਖਾਦ
      - ਸਿੰਚਾਈ ਅਤੇ ਪਾਣੀ ਪ੍ਰਬੰਧਨ
      - ਮੌਸਮ ਸਬੰਧੀ ਖੇਤੀ ਫੈਸਲੇ
      - ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਅਤੇ ਸਬਸਿਡੀਆਂ
      
      ਸੰਖੇਪ (2-4 ਵਾਕ) ਜਵਾਬ ਦਿਓ, ਸਰਲ ਭਾਸ਼ਾ ਵਰਤੋ, ਅਤੇ ਛੋਟੇ ਕਿਸਾਨਾਂ ਲਈ ਉਪਲਬਧ ਹੱਲਾਂ 'ਤੇ ਧਿਆਨ ਦਿਓ।`,
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
