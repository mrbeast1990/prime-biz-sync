import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PharmacySettings } from '@/types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => { map[row.key] = row.value; });
      return {
        name: map['pharmacy_name'] || 'صيدلية النور',
        phone: map['pharmacy_phone'] || '',
        address: map['pharmacy_address'] || '',
        receiptSize: (map['receipt_size'] || '80mm') as PharmacySettings['receiptSize'],
      } as PharmacySettings;
    },
  });
}
