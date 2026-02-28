import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Save, Store, Printer, Image, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { data: savedSettings, isLoading } = useSettings();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    name: 'صيدلية النور',
    phone: '',
    address: '',
    receiptSize: '80mm',
    logo: '',
    invoiceTemplate: 'classic',
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        name: savedSettings.name,
        phone: savedSettings.phone,
        address: savedSettings.address,
        receiptSize: savedSettings.receiptSize,
        logo: savedSettings.logo || '',
        invoiceTemplate: savedSettings.invoiceTemplate || 'classic',
      });
    }
  }, [savedSettings]);

  const upsertSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
    if (existing) {
      await supabase.from('settings').update({ value }).eq('key', key);
    } else {
      await supabase.from('settings').insert({ key, value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertSetting('pharmacy_name', settings.name);
      await upsertSetting('pharmacy_phone', settings.phone);
      await upsertSetting('pharmacy_address', settings.address);
      await upsertSetting('receipt_size', settings.receiptSize);
      await upsertSetting('pharmacy_logo', settings.logo);
      await upsertSetting('invoice_template', settings.invoiceTemplate);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل حفظ الإعدادات', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'خطأ', description: 'حجم الملف أكبر من 2MB', variant: 'destructive' });
      return;
    }
    try {
      const ext = file.name.split('.').pop();
      const path = `logo/pharmacy-logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      setSettings({ ...settings, logo: urlData.publicUrl });
      toast({ title: 'تم رفع الشعار', description: 'تم رفع الشعار بنجاح، اضغط حفظ لتأكيد التغييرات' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل رفع الشعار', variant: 'destructive' });
    }
    e.target.value = '';
  };

  const templates = [
    { id: 'classic', name: 'كلاسيكي', color: '#2563eb', desc: 'أزرق احترافي' },
    { id: 'modern', name: 'حديث', color: '#059669', desc: 'أخضر عصري' },
    { id: 'simple', name: 'بسيط', color: '#374151', desc: 'رمادي مبسط' },
  ];

  if (isLoading) {
    return <MainLayout title="الإعدادات"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="الإعدادات">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleLogoUpload} />
      <div className="max-w-2xl space-y-6">
        {/* Pharmacy Info */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" /> بيانات الصيدلية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>اسم الصيدلية</Label>
              <Input value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} />
            </div>
            <div>
              <Label>العنوان</Label>
              <Input value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" /> شعار الصيدلية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.logo ? (
              <div className="flex items-center gap-4">
                <img src={settings.logo} alt="شعار الصيدلية" className="h-16 w-16 rounded-lg object-contain border bg-background p-1" />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>تغيير الشعار</Button>
                  <Button variant="outline" size="sm" onClick={() => setSettings({ ...settings, logo: '' })}>إزالة</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                <Image className="h-4 w-4" /> رفع شعار
              </Button>
            )}
            <p className="text-xs text-muted-foreground">سيظهر الشعار في الفواتير والتقارير المطبوعة (الحد الأقصى 2MB)</p>
          </CardContent>
        </Card>

        {/* Invoice Templates */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> نماذج الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, invoiceTemplate: t.id })}
                  className={cn(
                    'rounded-lg border-2 p-4 text-center transition-all hover:shadow-md',
                    settings.invoiceTemplate === t.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="h-8 w-full rounded mb-2" style={{ backgroundColor: t.color }} />
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" /> إعدادات الطباعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>حجم الفاتورة</Label>
              <Select value={settings.receiptSize} onValueChange={v => setSettings({ ...settings, receiptSize: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="80mm">80mm (حراري)</SelectItem>
                  <SelectItem value="58mm">58mm (حراري صغير)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ الإعدادات
        </Button>
      </div>
    </MainLayout>
  );
}
