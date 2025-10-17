import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type BookingPayload = {
  tool_id: string;
  start_date: string; // yyyy-mm-dd
  end_date: string;   // yyyy-mm-dd
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
      const user = await supabase.auth.getUser();
      if (!user.data.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      // List bookings where user is renter or owns the tool
      const { data, error } = await supabase
        .from('bookings')
        .select('*, tools!inner(owner_id, name, image_url, daily_rate, location)')
        .or(`renter_id.eq.${user.data.user.id},tools.owner_id.eq.${user.data.user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'POST') {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const body: BookingPayload = await req.json();

      // Fetch tool and ensure available
      const { data: tool, error: toolErr } = await supabase.from('tools').select('*').eq('id', body.tool_id).single();
      if (toolErr) throw toolErr;
      if (!tool.available) return new Response(JSON.stringify({ error: 'Tool not available' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      // Check conflicts: overlap if start <= existing.end AND end >= existing.start
      const { data: conflicts, error: confErr } = await supabase
        .from('bookings')
        .select('id')
        .eq('tool_id', body.tool_id)
        .neq('status', 'cancelled')
        .or('status.eq.pending,status.eq.confirmed')
        .lte('start_date', body.end_date)
        .gte('end_date', body.start_date);
      if (confErr) throw confErr;
      if (conflicts && conflicts.length > 0) {
        return new Response(JSON.stringify({ error: 'Dates conflict with an existing booking' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const days = Math.max(1, Math.ceil((Date.parse(body.end_date) - Date.parse(body.start_date)) / (1000 * 60 * 60 * 24)) + 1 - 1);
      const total = Number(tool.daily_rate) * Math.max(1, days);

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          tool_id: body.tool_id,
          renter_id: user.data.user.id,
          start_date: body.start_date,
          end_date: body.end_date,
          total_price: total,
          status: 'pending',
        })
        .select('*')
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method === 'PUT') {
      if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const user = await supabase.auth.getUser();
      if (!user.data.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const body: { status: 'pending'|'confirmed'|'completed'|'cancelled' } = await req.json();

      // Ensure user is renter or tool owner
      const { data: existing, error: selErr } = await supabase
        .from('bookings')
        .select('*, tools!inner(owner_id)')
        .eq('id', id)
        .single();
      if (selErr) throw selErr;
      const isOwner = existing.tools?.owner_id === user.data.user.id;
      const isRenter = existing.renter_id === user.data.user.id;
      if (!isOwner && !isRenter) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data, error } = await supabase.from('bookings').update({ status: body.status }).eq('id', id).select('*').single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('bookings function error', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});



