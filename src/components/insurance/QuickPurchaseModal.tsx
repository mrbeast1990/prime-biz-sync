import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package } from 'lucide-react';
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface QuickPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: (product: Product, quantity: number) => void;
}

async function generateInvoiceNumber() {
  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
  return `T-${String((count || 0) + 1).padStart(4, '0')}`;
}

async function getOrCreateQuickSupplier(): Promise<string> {
  const { data } = await supabase.from('contacts').select('id').eq('name', 'مشتريات سريعة').eq('contact_type', 'supplier').limit(1);
  if (data && data.length > 0) return data[0].id;
  const { data: created, error } = await supabase.from('contacts').insert({ name: 'مشتريات سريعة', contact_type: 'supplier' }).select().single();
  if (error) throw error;
  return created.id;
}

export function QuickPurchaseModal({ isOpen, onClose, product, onSuccess }: QuickPurchaseModalProps) {
  const queryClient = useQueryClient();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [costPrice, setCostPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setCostPrice(product.cost_price);
      setSalePrice(product.sale_price);
      setQuantity(product.units_per_package || 1);
      setExpiryDate(product.expiry_date || '');
      generateInvoiceNumber().then(setInvoiceNumber);
    }
  }, [isOpen, product]);

  const handleSave = async () => {
    if (!product || quantity <= 0) return;
    setSaving(true);
    try {
      const supplierId = await getOrCreateQuickSupplier();
      const totalCost = costPrice * quantity;

      // 1. Update product stock, cost_price, sale_price, expiry_date
      const { data: current } = await supabase.from('products').select('stock_quantity').eq('id', product.id).single();
      const newStock = (current?.stock_quantity || 0) + quantity;
      await supabase.from('products').update({
        stock_quantity: newStock,
        cost_price: costPrice,
        sale_price: salePrice,
        expiry_date: expiryDate || null,
      }).eq('id', product.id);

      // 2. Create purchase invoice
      const { data: inv, error: invErr } = await supabase.from('invoices').insert({
        invoice_type: 'purchase',
        contact_id: supplierId,
        contact_name: 'مشتريات سريعة',
        invoice_number: invoiceNumber,
        total: totalCost,
        paid: 0,
        status: 'pending',
      }).select().single();
      if (invErr) throw invErr;

      // 3. Create invoice item
      await supabase.from('invoice_items').insert({
        invoice_id: inv.id,
        product_id: product.id,
        product_name: product.trade_name,
        quantity,
        unit_price: costPrice,
        total: totalCost,
      });

      // 4. Create product batch
      await supabase.from('product_batches').insert({
        product_id: product.id,
        invoice_id: inv.id,
        quantity,
        original_quantity: quantity,
        expiry_date: expiryDate || null,
      });

      // 5. Treasury entry (expense)
      await supabase.from('treasury').insert({
        entry_type: 'expense',
        category: 'purchases',
        description: `شراء سريع - ${product.trade_name} - فاتورة ${invoiceNumber}`,
        amount: totalCost,
        reference_id: inv.id,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });

      toast({ title: 'تم الشراء السريع', description: `تمت إضافة ${quantity} وحدة من ${product.trade_name}` });

      // Pass updated product back
      const updatedProduct = { ...product, stock_quantity: newStock, cost_price: costPrice, sale_price: salePrice };
      onSuccess(updatedProduct, 1);
      onClose();
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل حفظ عملية الشراء السريع', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            شراء سريع - {product.trade_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>رقم الفاتورة</Label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="font-mono" />
          </div>
          <div>
            <Label>الكمية (بالوحدات/الأشرطة)</Label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <Label>تاريخ الصلاحية</Label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>سعر الشراء (للوحدة)</Label>
              <Input type="number" step="0.01" min={0} value={costPrice} onChange={(e) => setCostPrice(Number(e.target.value))} />
            </div>
            <div>
              <Label>سعر البيع (للوحدة)</Label>
              <Input type="number" step="0.01" min={0} value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} />
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p>الإجمالي: <span className="font-bold text-primary">{(costPrice * quantity).toFixed(2)} د.ل</span></p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving || quantity <= 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ وإضافة للسلة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
