
-- Create product_batches table for FEFO tracking
CREATE TABLE public.product_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  original_quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_product_batches_product_id ON public.product_batches(product_id);
CREATE INDEX idx_product_batches_expiry ON public.product_batches(product_id, expiry_date) WHERE quantity > 0;

-- Enable RLS
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can read product_batches"
  ON public.product_batches FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert product_batches"
  ON public.product_batches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can update product_batches"
  ON public.product_batches FOR UPDATE
  USING (true);
