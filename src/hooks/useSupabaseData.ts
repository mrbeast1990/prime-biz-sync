import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Contact, InsuranceCustomer } from '@/types';

// Products
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Product[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data, error } = await supabase.from('products').insert({
        barcode: product.barcode,
        trade_name: product.trade_name!,
        scientific_name: product.scientific_name,
        category: product.category,
        packaging_type: product.packaging_type,
        units_per_package: product.units_per_package,
        has_expiry: product.has_expiry,
        expiry_date: product.expiry_date || null,
        image_url: product.image_url || null,
        stock_quantity: product.stock_quantity || 0,
        min_stock: product.min_stock || 0,
        cost_price: product.cost_price || 0,
        sale_price: product.sale_price || 0,
        batch_number: product.batch_number || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase.from('products').update({
        barcode: product.barcode,
        trade_name: product.trade_name,
        scientific_name: product.scientific_name,
        category: product.category,
        packaging_type: product.packaging_type,
        units_per_package: product.units_per_package,
        has_expiry: product.has_expiry,
        expiry_date: product.expiry_date || null,
        image_url: product.image_url || null,
        stock_quantity: product.stock_quantity,
        min_stock: product.min_stock,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        batch_number: product.batch_number || null,
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

// Contacts
export function useContacts(type?: 'customer' | 'supplier') {
  return useQuery({
    queryKey: ['contacts', type],
    queryFn: async () => {
      let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (type) query = query.eq('contact_type', type);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Contact[];
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const { data, error } = await supabase.from('contacts').insert({
        name: contact.name!,
        contact_type: contact.contact_type || 'customer',
        phone: contact.phone || null,
        email: contact.email || null,
        address: contact.address || null,
        balance: contact.balance || 0,
      }).select().single();
      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

// Update Contact
export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; phone?: string; address?: string }) => {
      const { error } = await supabase.from('contacts').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

// Insurance Customers
export function useInsuranceCustomers() {
  return useQuery({
    queryKey: ['insurance_customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as InsuranceCustomer[];
    },
  });
}

export function useCreateInsuranceCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Partial<InsuranceCustomer>) => {
      const { data, error } = await supabase.from('insurance_customers').insert({
        name: customer.name!,
        card_number: customer.card_number || null,
        phone: customer.phone || null,
        balance: customer.balance || 0,
      }).select().single();
      if (error) throw error;
      return data as InsuranceCustomer;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance_customers'] }),
  });
}

export function useUpdateInsuranceCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<InsuranceCustomer> & { id: string }) => {
      const { data, error } = await supabase.from('insurance_customers').update({
        name: customer.name,
        card_number: customer.card_number,
        phone: customer.phone,
      }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance_customers'] }),
  });
}

// Insurance Sales
export function useInsuranceSales() {
  return useQuery({
    queryKey: ['insurance_sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insurance_sales')
        .select('*')
        .order('sale_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateInsuranceSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sale: { customer_id: string; customer_name: string; total: number; sale_date?: string; items: { product_id: string; product_name: string; quantity: number; unit_price: number; total: number }[] }) => {
      const { items, sale_date, ...rest } = sale;
      const saleData = sale_date ? { ...rest, sale_date } : rest;
      const { data, error } = await supabase.from('insurance_sales').insert(saleData).select().single();
      if (error) throw error;

      if (items.length > 0) {
        const itemsWithSaleId = items.map(item => ({
          sale_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }));
        const { error: itemsError } = await supabase.from('insurance_sale_items' as any).insert(itemsWithSaleId);
        if (itemsError) throw itemsError;
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insurance_sales'] }),
  });
}

export function useInsuranceSaleItems(saleId?: string) {
  return useQuery({
    queryKey: ['insurance_sale_items', saleId],
    queryFn: async () => {
      if (!saleId) return [];
      const { data, error } = await supabase
        .from('insurance_sale_items' as any)
        .select('*')
        .eq('sale_id', saleId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!saleId,
  });
}

// Invoices
export function useInvoices(type?: string) {
  return useQuery({
    queryKey: ['invoices', type],
    queryFn: async () => {
      let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });
      if (type) query = query.eq('invoice_type', type);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useInvoiceItems(invoiceId?: string) {
  return useQuery({
    queryKey: ['invoice_items', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!invoiceId,
  });
}

// Profiles (for seller safes)
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data || [];
    },
  });
}

// Treasury
export function useTreasuryEntries() {
  return useQuery({
    queryKey: ['treasury'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treasury')
        .select('*')
        .order('entry_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateTreasuryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { entry_type: string; description: string; amount: number; category?: string }) => {
      const { data, error } = await supabase.from('treasury').insert(entry).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['treasury'] }),
  });
}

// Update product stock
export function useUpdateProductStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;
      
      const newQty = (product?.stock_quantity || 0) + delta;
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newQty })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

// Create invoice with items
export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: {
      invoice_type: string;
      contact_id?: string;
      contact_name?: string;
      total: number;
      paid: number;
      status: string;
      payment_method?: string;
      invoice_number?: string;
      created_by?: string;
      items: { product_id: string; product_name: string; quantity: number; unit_price: number; total: number; unit_type?: string }[];
    }) => {
      const { items, ...invoiceData } = invoice;
      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
      if (invError) throw invError;

      if (items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({
          invoice_id: inv.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          unit_type: item.unit_type || 'package',
        }));
        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsWithInvoiceId);
        if (itemsError) throw itemsError;
      }

      return inv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Update invoice
export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; total?: number; paid?: number; status?: string; invoice_number?: string; payment_method?: string }) => {
      const { error } = await supabase.from('invoices').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

// Update invoice item
export function useUpdateInvoiceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; quantity?: number; unit_price?: number; total?: number }) => {
      const { error } = await supabase.from('invoice_items').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice_items'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
