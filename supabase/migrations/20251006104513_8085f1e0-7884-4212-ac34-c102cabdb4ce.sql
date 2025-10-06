-- Add phone column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- Update profiles table to ensure language is properly set
ALTER TABLE public.profiles 
ALTER COLUMN language SET DEFAULT 'en';

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);