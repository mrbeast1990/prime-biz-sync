
CREATE TABLE public.customer_default_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.insurance_customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

ALTER TABLE public.customer_default_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read customer_default_medications"
ON public.customer_default_medications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert customer_default_medications"
ON public.customer_default_medications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update customer_default_medications"
ON public.customer_default_medications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete customer_default_medications"
ON public.customer_default_medications FOR DELETE TO authenticated USING (true);
