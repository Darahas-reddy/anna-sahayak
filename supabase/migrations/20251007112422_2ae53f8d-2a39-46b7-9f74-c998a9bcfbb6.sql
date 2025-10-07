-- Create market_prices table for real-time mandi/market prices
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  variety TEXT,
  market_name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  price_per_quintal NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create government_schemes table
CREATE TABLE IF NOT EXISTS public.government_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_name TEXT NOT NULL,
  scheme_type TEXT NOT NULL CHECK (scheme_type IN ('subsidy', 'loan', 'insurance', 'training', 'other')),
  description TEXT NOT NULL,
  eligibility TEXT,
  benefits TEXT,
  application_process TEXT,
  contact_info TEXT,
  state TEXT,
  district TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crop_calendar table for personalized farming schedules
CREATE TABLE IF NOT EXISTS public.crop_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  planting_date DATE NOT NULL,
  expected_harvest_date DATE,
  field_size NUMERIC,
  field_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create crop_reminders table for activity reminders
CREATE TABLE IF NOT EXISTS public.crop_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_calendar_id UUID NOT NULL REFERENCES public.crop_calendar(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('sowing', 'irrigation', 'fertilization', 'pest_control', 'harvest', 'other')),
  reminder_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for market_prices (public read)
CREATE POLICY "Anyone can view market prices"
  ON public.market_prices FOR SELECT
  USING (true);

-- RLS Policies for government_schemes (public read)
CREATE POLICY "Anyone can view government schemes"
  ON public.government_schemes FOR SELECT
  USING (is_active = true);

-- RLS Policies for crop_calendar
CREATE POLICY "Users can view own crop calendar"
  ON public.crop_calendar FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crop calendar"
  ON public.crop_calendar FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crop calendar"
  ON public.crop_calendar FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crop calendar"
  ON public.crop_calendar FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for crop_reminders
CREATE POLICY "Users can view own reminders"
  ON public.crop_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON public.crop_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON public.crop_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.crop_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_market_prices_crop ON public.market_prices(crop_name);
CREATE INDEX IF NOT EXISTS idx_market_prices_location ON public.market_prices(state, district);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON public.market_prices(date DESC);
CREATE INDEX IF NOT EXISTS idx_government_schemes_type ON public.government_schemes(scheme_type);
CREATE INDEX IF NOT EXISTS idx_government_schemes_location ON public.government_schemes(state, district);
CREATE INDEX IF NOT EXISTS idx_crop_calendar_user ON public.crop_calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_reminders_user ON public.crop_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_reminders_date ON public.crop_reminders(reminder_date);

-- Triggers for updated_at
CREATE TRIGGER update_market_prices_updated_at
  BEFORE UPDATE ON public.market_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_government_schemes_updated_at
  BEFORE UPDATE ON public.government_schemes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crop_calendar_updated_at
  BEFORE UPDATE ON public.crop_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();