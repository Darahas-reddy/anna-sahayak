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
    const { location, lat, lon } = await req.json();

    // OpenWeatherMap API - get from secrets
    const API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    if (!API_KEY) {
      throw new Error('OPENWEATHER_API_KEY is not configured');
    }
    
    let url = '';

    // Try OpenWeather first
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else if (location) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=metric`;
    } else {
      throw new Error('Either location or coordinates (lat, lon) must be provided');
    }

    const tryOpenWeather = async () => {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        location: `${data.name}, ${data.sys.country}`,
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s -> km/h
        description: data.weather?.[0]?.description || 'current conditions',
        icon: data.weather?.[0]?.icon || '01d',
        rainfall: data.rain?.['1h'] || 0,
      };
    };

    const tryOpenMeteo = async () => {
      let latNum = lat, lonNum = lon, locLabel = location as string | undefined;

      if ((!latNum || !lonNum) && location) {
        // Geocode location to coords (no key required)
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          const first = geo.results?.[0];
          if (first) {
            latNum = first.latitude;
            lonNum = first.longitude;
            locLabel = `${first.name}${first.country ? ", " + first.country : ''}`;
          }
        }
      }

      if (!latNum || !lonNum) return null;

      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`;
      const omRes = await fetch(omUrl);
      if (!omRes.ok) return null;
      const om = await omRes.json();
      const cur = om.current || {};
      const rainfall = Math.max(0, Math.round((cur.precipitation ?? 0)));
      const desc = (cur.precipitation ?? 0) > 0 ? 'rain' : 'clear sky';

      return {
        location: locLabel || `${latNum}, ${lonNum}`,
        temperature: Math.round(cur.temperature_2m ?? 0),
        humidity: Math.round(cur.relative_humidity_2m ?? 0),
        windSpeed: Math.round(cur.wind_speed_10m ?? 0),
        description: desc,
        icon: (cur.precipitation ?? 0) > 0 ? '10d' : '01d',
        rainfall,
      };
    };

    let weather = await tryOpenWeather();
    if (!weather) {
      // Fallback provider when OpenWeather fails (e.g., invalid key)
      weather = await tryOpenMeteo();
    }

    if (!weather) {
      throw new Error('Weather providers unavailable');
    }

    return new Response(
      JSON.stringify({ weather }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-weather:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
