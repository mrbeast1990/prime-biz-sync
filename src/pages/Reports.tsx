import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockInvoices, mockInsuranceSales, mockPurchaseOrders, mockProducts } from '@/data/mockData';
import { BarChart3, ShoppingCart, TrendingUp, Package } from 'lucide-react';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(199, 89%, 48%)'];

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const salesTotal = mockInvoices.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
  const insuranceSalesTotal = mockInsuranceSales.reduce((s, i) => s + i.total, 0);
  const purchasesTotal = mockPurchaseOrders.reduce((s, o) => s + o.total, 0);
  const costOfGoods = mockInvoices.filter(i => i.type === 'sale').reduce((sum, inv) => {
    return sum + inv.items.reduce((iSum, item) => {
      const product = mockProducts.find(p => p.id === item.productId);
      return iSum + (product ? product.costPrice * item.quantity : 0);
    }, 0);
  }, 0);
  const profit = salesTotal + insuranceSalesTotal - costOfGoods;

  const salesChartData = [
    { name: 'المبيعات النقدية', value: salesTotal },
    { name: 'مبيعات التأمين', value: insuranceSalesTotal },
    { name: 'المشتريات', value: purchasesTotal },
  ];

  const chartConfig = {
    value: { label: 'القيمة', color: 'hsl(217, 91%, 50%)' },
  };

  // Top selling products
  const productSales: Record<string, { name: string; qty: number; total: number }> = {};
  mockInvoices.filter(i => i.type === 'sale').forEach(inv => {
    inv.items.forEach(item => {
      if (!productSales[item.productId]) productSales[item.productId] = { name: item.productName, qty: 0, total: 0 };
      productSales[item.productId].qty += item.quantity;
      productSales[item.productId].total += item.total;
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.total - a.total);

  // Low stock
  const lowStock = mockProducts.filter(p => p.stockQuantity <= p.minStock);

  return (
    <MainLayout title="التقارير">
      <div className="space-y-6">
        {/* Date Filter */}
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <Label>من تاريخ</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>إلى تاريخ</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-xl font-bold">{(salesTotal + insuranceSalesTotal).toFixed(2)} ر.س</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <ShoppingCart className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المشتريات</p>
                <p className="text-xl font-bold">{purchasesTotal.toFixed(2)} ر.س</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح</p>
                <p className="text-xl font-bold">{profit.toFixed(2)} ر.س</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-card">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Package className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">مخزون منخفض</p>
                <p className="text-xl font-bold">{lowStock.length} منتج</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales" dir="rtl">
          <TabsList>
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
            <TabsTrigger value="top-products">الأكثر مبيعاً</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card className="border-0 shadow-card">
              <CardHeader><CardTitle>توزيع الإيرادات والمصروفات</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {salesChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="top-products">
            <Card className="border-0 shadow-card">
              <CardHeader><CardTitle>المنتجات الأكثر مبيعاً</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">الكمية المباعة</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.qty}</TableCell>
                        <TableCell className="tabular-nums">{p.total.toFixed(2)} ر.س</TableCell>
                      </TableRow>
                    ))}
                    {topProducts.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card className="border-0 shadow-card">
              <CardHeader><CardTitle>حركة المخزون - منتجات بمخزون منخفض</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">المخزون الحالي</TableHead>
                      <TableHead className="text-right">الحد الأدنى</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProducts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.tradeName}</TableCell>
                        <TableCell>{p.stockQuantity}</TableCell>
                        <TableCell>{p.minStock}</TableCell>
                        <TableCell>
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${p.stockQuantity <= p.minStock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                            {p.stockQuantity <= p.minStock ? 'منخفض' : 'متوفر'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
