import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Save, Store, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    name: 'صيدلية النور',
    phone: '0112345678',
    address: 'الرياض - شارع الملك فهد',
    receiptSize: '80mm',
  });

  const handleSave = () => {
    toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
  };

  return (
    <MainLayout title="الإعدادات">
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

        <Button onClick={handleSave} className="w-full" size="lg">
          <Save className="h-4 w-4 ml-2" /> حفظ الإعدادات
        </Button>
      </div>
    </MainLayout>
  );
}
