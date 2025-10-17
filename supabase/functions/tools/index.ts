import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ToolPayload = {
  name: string;
  category: string;
  description?: string;
  image_url?: string;
  daily_rate: number;
  available?: boolean;
  location?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (req.method === 'GET') {
      const available = url.searchParams.get('available');
      const category = url.searchParams.get('category');
      const location = url.searchParams.get('location');

      let query = supabase.from('tools').select('*');
      if (available !== null) query = query.eq('available', available === 'true');
      if (category) query = query.eq('category', category);
      if (location) query = query.ilike('location', `%${location}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const body: ToolPayload = await req.json();
      const insert = {
        owner_id: user.data.user.id,
        name: body.name,
        category: body.category,
        description: body.description ?? null,
        image_url: body.image_url ?? null,
        daily_rate: body.daily_rate,
        available: body.available ?? true,
        location: body.location ?? null,
      };
      const { data, error } = await supabase.from('tools').insert(insert).select('*').single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'PUT') {
      if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const user = await supabase.auth.getUser();
      if (!user.data.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const body: Partial<ToolPayload> = await req.json();
      const update: Record<string, unknown> = {};
      if (body.name !== undefined) update.name = body.name;
      if (body.category !== undefined) update.category = body.category;
      if (body.description !== undefined) update.description = body.description;
      if (body.image_url !== undefined) update.image_url = body.image_url;
      if (body.daily_rate !== undefined) update.daily_rate = body.daily_rate;
      if (body.available !== undefined) update.available = body.available;
      if (body.location !== undefined) update.location = body.location;

      // Ensure ownership
      const { data: existing, error: selErr } = await supabase.from('tools').select('owner_id').eq('id', id).single();
      if (selErr) throw selErr;
      if (!existing || existing.owner_id !== user.data.user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data, error } = await supabase.from('tools').update(update).eq('id', id).select('*').single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('tools function error', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});



