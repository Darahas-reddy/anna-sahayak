-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  language TEXT DEFAULT 'en',
  state TEXT,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create disease detections table
CREATE TABLE IF NOT EXISTS public.disease_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  crop_type TEXT,
  disease_name TEXT,
  confidence DECIMAL(5,2),
  remedies JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on disease detections
ALTER TABLE public.disease_detections ENABLE ROW LEVEL SECURITY;

-- Disease detections policies
CREATE POLICY "Users can view own detections"
  ON public.disease_detections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own detections"
  ON public.disease_detections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  language TEXT DEFAULT 'en',
  is_voice BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Chat messages policies
CREATE POLICY "Users can view own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create pesticide recommendations table (public data)
CREATE TABLE IF NOT EXISTS public.pesticide_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  disease TEXT,
  dosage TEXT,
  safety_period TEXT,
  is_government_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow public read
ALTER TABLE public.pesticide_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pesticide recommendations"
  ON public.pesticide_recommendations FOR SELECT
  TO authenticated
  USING (true);

-- Create weather alerts table
CREATE TABLE IF NOT EXISTS public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on weather alerts
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- Weather alerts policies
CREATE POLICY "Users can view own alerts"
  ON public.weather_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON public.weather_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Farmer'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample pesticide data
INSERT INTO public.pesticide_recommendations (name, type, crop_type, disease, dosage, safety_period, is_government_approved)
VALUES
  ('Mancozeb 75% WP', 'Fungicide', 'Rice', 'Leaf Blast', '2-2.5 kg/ha', '15 days', true),
  ('Chlorpyrifos 20% EC', 'Insecticide', 'Cotton', 'Bollworm', '2.5 ml/L', '21 days', true),
  ('Carbendazim 50% WP', 'Fungicide', 'Wheat', 'Powdery Mildew', '1 g/L', '20 days', true),
  ('Imidacloprid 17.8% SL', 'Insecticide', 'Rice', 'Brown Plant Hopper', '0.5 ml/L', '30 days', true),
  ('Copper Oxychloride 50% WP', 'Fungicide', 'Tomato', 'Late Blight', '2.5 g/L', '7 days', true),
  ('Profenofos 50% EC', 'Insecticide', 'Cotton', 'Aphids', '2 ml/L', '15 days', true),
  ('Azoxystrobin 23% SC', 'Fungicide', 'Rice', 'Sheath Blight', '1 ml/L', '25 days', true),
  ('Thiamethoxam 25% WG', 'Insecticide', 'Wheat', 'Aphids', '0.2 g/L', '21 days', true);

-- Create storage bucket for crop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-images', 'crop-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for crop images
CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'crop-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'crop-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public images are viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crop-images');