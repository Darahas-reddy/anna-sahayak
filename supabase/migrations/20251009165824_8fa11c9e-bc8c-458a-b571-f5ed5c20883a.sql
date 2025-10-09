-- Create expenses table for Farm Analytics
CREATE TABLE public.farm_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON public.farm_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON public.farm_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON public.farm_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON public.farm_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create yield records table
CREATE TABLE public.yield_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'quintals',
  harvest_date DATE NOT NULL,
  field_location TEXT,
  revenue NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.yield_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yields"
  ON public.yield_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own yields"
  ON public.yield_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yields"
  ON public.yield_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own yields"
  ON public.yield_records FOR DELETE
  USING (auth.uid() = user_id);

-- Create yield predictions table
CREATE TABLE public.yield_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  predicted_yield NUMERIC NOT NULL,
  confidence_level NUMERIC,
  factors JSONB,
  prediction_date DATE NOT NULL,
  expected_harvest_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.yield_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions"
  ON public.yield_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON public.yield_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create pest alerts table for community warnings
CREATE TABLE public.pest_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pest_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  state TEXT,
  district TEXT,
  crop_affected TEXT,
  image_url TEXT,
  confirmed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pest_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pest alerts"
  ON public.pest_alerts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own alerts"
  ON public.pest_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create pest alert confirmations table
CREATE TABLE public.pest_alert_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.pest_alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(alert_id, user_id)
);

ALTER TABLE public.pest_alert_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view confirmations"
  ON public.pest_alert_confirmations FOR SELECT
  USING (true);

CREATE POLICY "Users can confirm alerts"
  ON public.pest_alert_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_farm_expenses_updated_at
  BEFORE UPDATE ON public.farm_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yield_records_updated_at
  BEFORE UPDATE ON public.yield_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();