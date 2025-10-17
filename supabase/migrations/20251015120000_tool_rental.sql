-- Tool Rental feature: Tool and Booking tables
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  daily_rate NUMERIC NOT NULL CHECK (daily_rate >= 0),
  available BOOLEAN NOT NULL DEFAULT true,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','completed','cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_dates_valid CHECK (end_date >= start_date)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_tools_owner ON public.tools(owner_id);
CREATE INDEX IF NOT EXISTS idx_tools_available_category_location ON public.tools(available, category, location);
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON public.bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tool_dates ON public.bookings(tool_id, start_date, end_date);

-- RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Tools policies
CREATE POLICY "Read all tools" ON public.tools
  FOR SELECT USING (true);

CREATE POLICY "Insert own tools" ON public.tools
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Update own tools" ON public.tools
  FOR UPDATE USING (auth.uid() = owner_id);

-- Bookings policies
CREATE POLICY "Read own bookings or by tool owner" ON public.bookings
  FOR SELECT USING (
    auth.uid() = renter_id OR auth.uid() IN (
      SELECT owner_id FROM public.tools t WHERE t.id = bookings.tool_id
    )
  );

CREATE POLICY "Insert booking as renter" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Update booking status by renter or tool owner" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = renter_id OR auth.uid() IN (
      SELECT owner_id FROM public.tools t WHERE t.id = bookings.tool_id
    )
  );

-- updated_at triggers
CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



