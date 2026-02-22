
-- Add new columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS packaging_type text DEFAULT 'علبة';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS units_per_package integer DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_expiry boolean DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;

-- Add unit_type to invoice_items
ALTER TABLE public.invoice_items ADD COLUMN IF NOT EXISTS unit_type text DEFAULT 'package';

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
