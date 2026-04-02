ALTER TABLE public.products ADD COLUMN is_insurance boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN is_insurance_shortcut boolean NOT NULL DEFAULT false;