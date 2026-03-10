import { supabase } from '@/integrations/supabase/client';

export async function exportBackup(): Promise<void> {
  const tables = [
    'products',
    'contacts',
    'invoices',
    'invoice_items',
    'insurance_customers',
    'insurance_sales',
    'insurance_sale_items',
    'treasury',
    'product_batches',
    'settings',
  ] as const;

  const backup: Record<string, any[]> = {};

  await Promise.all(
    tables.map(async (table) => {
      const { data } = await supabase.from(table).select('*');
      backup[table] = data || [];
    })
  );

  const payload = {
    version: 1,
    created_at: new Date().toISOString(),
    data: backup,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const name = `backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  localStorage.setItem('last_backup_date', now.toISOString());
}
