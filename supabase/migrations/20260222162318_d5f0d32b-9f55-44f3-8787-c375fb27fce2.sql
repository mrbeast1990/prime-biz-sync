
CREATE TABLE public.insurance_sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid NOT NULL REFERENCES public.insurance_sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  product_name text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read insurance_sale_items"
ON public.insurance_sale_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert insurance_sale_items"
ON public.insurance_sale_items FOR INSERT TO authenticated WITH CHECK (true);
