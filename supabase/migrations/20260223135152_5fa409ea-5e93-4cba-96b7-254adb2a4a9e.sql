ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_type_check 
  CHECK (invoice_type = ANY (ARRAY['sale', 'purchase', 'return', 'damage']));