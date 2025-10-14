import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AgmarknetRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string | null;
  arrival_date: string; // dd/mm/yyyy
  modal_price: string; // number in string
  min_price?: string;
  max_price?: string;
  unit?: string; // usually Rs/quintal
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crop, state, limit = 500 } = await req.json().catch(() => ({}));

    const API_KEY = Deno.env.get('AGMARKNET_API_KEY');
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AGMARKNET_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams({
      'api-key': API_KEY,
      format: 'json',
      limit: String(limit),
    });
    if (crop) params.set('filters[commodity]', crop);
    if (state) params.set('filters[state]', state);

    const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?${params}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Agmarknet error: ${resp.status} ${text}`);
    }
    const payload = await resp.json();
    const records: AgmarknetRecord[] = payload?.records ?? [];

    const normalized = records.map((r) => {
      // Convert dd/mm/yyyy to ISO yyyy-mm-dd for UI consistency
      const [dd, mm, yyyy] = (r.arrival_date || '').split('/');
      const iso = yyyy && mm && dd ? `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}` : undefined;
      const price = Number(r.modal_price ?? '0');
      return {
        crop_name: r.commodity,
        variety: r.variety || undefined,
        state: r.state,
        district: r.district,
        market_name: r.market,
        price_per_quintal: isFinite(price) ? price : null,
        date: iso ?? new Date().toISOString().slice(0, 10),
        unit: r.unit || 'Rs/Quintal',
      };
    }).filter((x) => x.price_per_quintal !== null);

    return new Response(
      JSON.stringify({ data: normalized }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in market-prices:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


