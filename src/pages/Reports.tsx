import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts';
import { BarChart3, ShoppingCart, TrendingUp, Package, Loader2 } from 'lucide-react';
import { useProducts, useInvoices, useInsuranceSales } from '@/hooks/useSupabaseData';
import { formatStockDisplay } from '@/utils/stockDisplay';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(199, 89%, 48%)'];

export default function Reports() {
  const { data: products = [], isLoading } = useProducts();
  const { data: invoices = [] } = useInvoices();
  const { data: insuranceSales = [] } = useInsuranceSales();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const salesTotal = invoices.filter(i => i.invoice_type === 'sale').reduce((s, i) => s + Number(i.total), 0);
  const insuranceSalesTotal = insuranceSales.reduce((s, i) => s + Number(i.total), 0);
  const purchasesTotal = invoices.filter(i => i.invoice_type === 'purchase').reduce((s, i) => s + Number(i.total), 0);
  const profit = salesTotal + insuranceSalesTotal - purchasesTotal;

  const salesChartData = [
    { name: 'المبيعات النقدية', value: salesTotal },
    { name: 'مبيعات التأمين', value: insuranceSalesTotal },
    { name: 'المشتريات', value: purchasesTotal },
  ];

  const chartConfig = { value: { label: 'القيمة', color: 'hsl(217, 91%, 50%)' } };
  const lowStock = products.filter(p => p.stock_quantity <= p.min_stock);

  if (isLoading) {
    return <MainLayout title="التقارير"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="التقارير">
      <div className="space-y-6">
        <div className="flex items-end gap-3 md:gap-4 flex-wrap">
          <div className="w-full sm:w-auto"><Label>من تاريخ</Label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full" /></div>
          <div className="w-full sm:w-auto"><Label>إلى تاريخ</Label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-card"><CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4"><div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-success/10"><TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-success" /></div><div className="min-w-0"><p className="text-xs md:text-sm text-muted-foreground">إجمالي المبيعات</p><p className="text-lg md:text-xl font-bold truncate">{(salesTotal + insuranceSalesTotal).toFixed(2)} د.ل</p></div></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4"><div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-destructive/10"><ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-destructive" /></div><div className="min-w-0"><p className="text-xs md:text-sm text-muted-foreground">إجمالي المشتريات</p><p className="text-lg md:text-xl font-bold truncate">{purchasesTotal.toFixed(2)} د.ل</p></div></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4"><div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary/10"><BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-primary" /></div><div className="min-w-0"><p className="text-xs md:text-sm text-muted-foreground">صافي الربح</p><p className="text-lg md:text-xl font-bold truncate">{profit.toFixed(2)} د.ل</p></div></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4"><div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-warning/10"><Package className="h-5 w-5 md:h-6 md:w-6 text-warning" /></div><div className="min-w-0"><p className="text-xs md:text-sm text-muted-foreground">مخزون منخفض</p><p className="text-lg md:text-xl font-bold">{lowStock.length} منتج</p></div></CardContent></Card>
        </div>

        <Tabs defaultValue="sales" dir="rtl">
          <TabsList>
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card className="border-0 shadow-card">
              <CardHeader><CardTitle>توزيع الإيرادات والمصروفات</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full">
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {salesChartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="border-0 shadow-card">
              <CardHeader><CardTitle>حركة المخزون - منتجات بمخزون منخفض</CardTitle></CardHeader>
              <CardContent>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {products.map(p => (
                    <div key={p.id} className="rounded-lg bg-muted/30 p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{p.trade_name}</p>
                        <p className="text-xs text-muted-foreground">المخزون: {formatStockDisplay(p.stock_quantity, p.units_per_package)} | الحد: {formatStockDisplay(p.min_stock, p.units_per_package)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.stock_quantity <= p.min_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                        {p.stock_quantity <= p.min_stock ? 'منخفض' : 'متوفر'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead className="text-right">المنتج</TableHead><TableHead className="text-right">المخزون الحالي</TableHead><TableHead className="text-right">الحد الأدنى</TableHead><TableHead className="text-right">الحالة</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {products.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.trade_name}</TableCell>
                          <TableCell>{formatStockDisplay(p.stock_quantity, p.units_per_package)}</TableCell>
                          <TableCell>{formatStockDisplay(p.min_stock, p.units_per_package)}</TableCell>
                          <TableCell>
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${p.stock_quantity <= p.min_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                              {p.stock_quantity <= p.min_stock ? 'منخفض' : 'متوفر'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
