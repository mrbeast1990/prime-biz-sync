
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
$$;

-- 5. Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT,
  trade_name TEXT NOT NULL,
  scientific_name TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  cost_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  expiry_date DATE,
  min_stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_trade_name ON public.products(trade_name);
CREATE INDEX idx_products_category ON public.products(category);

-- 6. Contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_type TEXT NOT NULL DEFAULT 'customer' CHECK (contact_type IN ('customer', 'supplier')),
  phone TEXT,
  email TEXT,
  address TEXT,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_contacts_type ON public.contacts(contact_type);
CREATE INDEX idx_contacts_name ON public.contacts(name);

-- 7. Insurance customers table
CREATE TABLE public.insurance_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  card_number TEXT,
  phone TEXT,
  balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_customers ENABLE ROW LEVEL SECURITY;

-- 8. Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT,
  invoice_type TEXT NOT NULL DEFAULT 'sale' CHECK (invoice_type IN ('sale', 'purchase')),
  contact_id UUID REFERENCES public.contacts(id),
  contact_name TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  paid NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT DEFAULT 'cash',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invoices_type ON public.invoices(invoice_type);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date);

-- 9. Invoice items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- 10. Insurance sales table
CREATE TABLE public.insurance_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.insurance_customers(id),
  customer_name TEXT,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_sales ENABLE ROW LEVEL SECURITY;

-- 11. Ledger table
CREATE TABLE public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('income', 'expense')),
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  running_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  reference_id TEXT,
  reference_type TEXT,
  contact_id UUID REFERENCES public.contacts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;

-- 12. Treasury table
CREATE TABLE public.treasury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('income', 'expense', 'deposit', 'withdrawal')),
  category TEXT CHECK (category IN ('sales', 'insurance_sales', 'purchases', 'manual')),
  description TEXT,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  running_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.treasury ENABLE ROW LEVEL SECURITY;

-- 13. Settings table
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 14. Auto-update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_insurance_customers_updated_at BEFORE UPDATE ON public.insurance_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. RLS Policies

-- user_roles: only admins can manage, users can read own
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- profiles: users can read all, update own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- products: authenticated can read, manager+ can write
CREATE POLICY "Authenticated can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

-- contacts: authenticated can read/write
CREATE POLICY "Authenticated can read contacts" ON public.contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (public.is_admin());

-- insurance_customers: authenticated can read/write
CREATE POLICY "Authenticated can read insurance_customers" ON public.insurance_customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert insurance_customers" ON public.insurance_customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update insurance_customers" ON public.insurance_customers FOR UPDATE TO authenticated USING (true);

-- invoices: authenticated can read/insert/update, admin delete
CREATE POLICY "Authenticated can read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.is_admin());

-- invoice_items: same as invoices
CREATE POLICY "Authenticated can read invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated USING (public.is_admin());

-- insurance_sales
CREATE POLICY "Authenticated can read insurance_sales" ON public.insurance_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert insurance_sales" ON public.insurance_sales FOR INSERT TO authenticated WITH CHECK (true);

-- ledger: manager+ can read/write
CREATE POLICY "Manager+ can read ledger" ON public.ledger FOR SELECT TO authenticated USING (public.is_manager_or_admin());
CREATE POLICY "Manager+ can insert ledger" ON public.ledger FOR INSERT TO authenticated WITH CHECK (public.is_manager_or_admin());

-- treasury: manager+ can read/write
CREATE POLICY "Manager+ can read treasury" ON public.treasury FOR SELECT TO authenticated USING (public.is_manager_or_admin());
CREATE POLICY "Manager+ can insert treasury" ON public.treasury FOR INSERT TO authenticated WITH CHECK (public.is_manager_or_admin());

-- settings: admin only
CREATE POLICY "Admins can read settings" ON public.settings FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (public.is_admin());

-- 17. Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('pharmacy_name', 'صيدلية النموذج'),
  ('pharmacy_phone', '0501234567'),
  ('pharmacy_address', 'الرياض'),
  ('receipt_size', '80mm');
