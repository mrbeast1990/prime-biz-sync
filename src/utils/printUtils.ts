import { PharmacySettings } from '@/types';

interface PrintItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoicePrintData {
  invoiceNumber?: string;
  date: string;
  contactName: string;
  items: PrintItem[];
  total: number;
  paid: number;
  invoiceType: string;
}

interface PaymentPrintData {
  date: string;
  contactName: string;
  amount: number;
  paymentMethod: string;
  invoiceNumber?: string;
  remainingBalance?: number;
}

interface AccountStatementEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface AccountStatementData {
  contactName: string;
  entries: AccountStatementEntry[];
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
}

const paymentMethodLabel = (m: string) => {
  const map: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل بنكي', check: 'شيك' };
  return map[m] || m;
};

const invoiceTypeLabel = (t: string) => {
  const map: Record<string, string> = { sale: 'فاتورة بيع', purchase: 'فاتورة مشتريات', return: 'فاتورة مرتجع', damage: 'فاتورة تالف' };
  return map[t] || 'فاتورة';
};

function openPrintWindow(html: string) {
  const w = window.open('', '_blank', 'width=800,height=600');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.print(); };
}

function getTemplateColors(template?: string) {
  switch (template) {
    case 'modern': return { primary: '#059669', headerBg: '#059669', accent: '#d1fae5' };
    case 'simple': return { primary: '#374151', headerBg: '#374151', accent: '#f3f4f6' };
    default: return { primary: '#2563eb', headerBg: '#2563eb', accent: '#dbeafe' };
  }
}

function buildPage(settings: PharmacySettings, title: string, body: string) {
  const colors = getTemplateColors(settings.invoiceTemplate);
  const logoHtml = settings.logo ? `<img src="${settings.logo}" alt="logo" style="height:120px;max-width:300px;object-fit:contain;margin:0 auto 12px;display:block" />` : '';
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Cairo',sans-serif;padding:20px;color:#1a1a1a;background:#fff}
.header{text-align:center;border-bottom:2px solid ${colors.primary};padding-bottom:16px;margin-bottom:20px}
.pharmacy-name{font-size:24px;font-weight:700;color:${colors.primary}}
.doc-title{font-size:18px;font-weight:600;margin-top:4px;color:#374151}
.info-row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px}
.info-label{color:#6b7280;font-weight:600}
table{width:100%;border-collapse:collapse;margin:16px 0}
th{background:${colors.headerBg};color:#fff;padding:8px 12px;text-align:right;font-size:13px}
td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px}
tr:nth-child(even){background:#f9fafb}
.totals{margin-top:16px;text-align:left;font-size:15px}
.totals .row{display:flex;justify-content:space-between;padding:4px 0}
.totals .total-final{font-weight:700;font-size:17px;color:${colors.primary};border-top:2px solid ${colors.primary};padding-top:8px;margin-top:8px}
.footer{margin-top:30px;border-top:1px solid #d1d5db;padding-top:12px;text-align:center;font-size:12px;color:#6b7280}
.debit{color:#dc2626} .credit{color:#059669}
@media print{body{padding:10px}button{display:none!important}}
</style>
</head>
<body>
<div class="header">
  ${logoHtml}
  <div class="pharmacy-name">${settings.name}</div>
  <div class="doc-title">${title}</div>
</div>
${body}
<div class="footer">
  ${settings.phone ? `هاتف: ${settings.phone}` : ''}
  ${settings.phone && settings.address ? ' | ' : ''}
  ${settings.address ? `العنوان: ${settings.address}` : ''}
</div>
</body></html>`;
}

export function printInvoicePDF(data: InvoicePrintData, settings: PharmacySettings) {
  const title = invoiceTypeLabel(data.invoiceType);
  const remaining = data.total - data.paid;
  const itemsHtml = data.items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.product_name}</td>
      <td>${item.quantity}</td>
      <td>${Number(item.unit_price).toFixed(2)}</td>
      <td>${Number(item.total).toFixed(2)}</td>
    </tr>`).join('');

  const body = `
    <div class="info-row"><span><span class="info-label">العميل/المورد:</span> ${data.contactName}</span><span><span class="info-label">التاريخ:</span> ${data.date}</span></div>
    ${data.invoiceNumber ? `<div class="info-row"><span><span class="info-label">رقم الفاتورة:</span> ${data.invoiceNumber}</span></div>` : ''}
    <table><thead><tr><th>#</th><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${itemsHtml}</tbody></table>
    <div class="totals">
      <div class="row"><span>الإجمالي:</span><span>${data.total.toFixed(2)} د.ل</span></div>
      <div class="row"><span>المسدد:</span><span>${data.paid.toFixed(2)} د.ل</span></div>
      <div class="row total-final"><span>المتبقي:</span><span>${remaining.toFixed(2)} د.ل</span></div>
    </div>`;

  openPrintWindow(buildPage(settings, title, body));
}

export function printPaymentReceipt(data: PaymentPrintData, settings: PharmacySettings) {
  const body = `
    <div class="info-row"><span><span class="info-label">العميل/المورد:</span> ${data.contactName}</span><span><span class="info-label">التاريخ:</span> ${data.date}</span></div>
    ${data.invoiceNumber ? `<div class="info-row"><span><span class="info-label">رقم الفاتورة:</span> ${data.invoiceNumber}</span></div>` : ''}
    <div style="text-align:center;margin:40px 0">
      <div style="font-size:16px;color:#6b7280;margin-bottom:8px">المبلغ المسدد</div>
      <div style="font-size:36px;font-weight:700;color:#2563eb">${data.amount.toFixed(2)} د.ل</div>
      <div style="font-size:14px;color:#6b7280;margin-top:8px">طريقة الدفع: ${paymentMethodLabel(data.paymentMethod)}</div>
      ${data.remainingBalance !== undefined ? `<div style="font-size:16px;font-weight:700;margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;color:${data.remainingBalance > 0 ? '#dc2626' : '#059669'}">الرصيد المتبقي: ${data.remainingBalance.toFixed(2)} د.ل</div>` : ''}
    </div>`;

  openPrintWindow(buildPage(settings, 'إيصال سداد', body));
}

export function printAccountStatement(data: AccountStatementData, settings: PharmacySettings) {
  const rowsHtml = data.entries.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${e.date}</td>
      <td>${e.description}</td>
      <td class="debit">${e.debit > 0 ? e.debit.toFixed(2) : ''}</td>
      <td class="credit">${e.credit > 0 ? e.credit.toFixed(2) : ''}</td>
      <td>${e.balance.toFixed(2)}</td>
    </tr>`).join('');

  const body = `
    <div class="info-row"><span><span class="info-label">الحساب:</span> ${data.contactName}</span><span><span class="info-label">التاريخ:</span> ${new Date().toLocaleDateString('en-GB')}</span></div>
    <table>
      <thead><tr><th>#</th><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr style="font-weight:700;border-top:2px solid #333">
          <td colspan="3">الإجمالي</td>
          <td class="debit">${data.totalDebit.toFixed(2)}</td>
          <td class="credit">${data.totalCredit.toFixed(2)}</td>
          <td>${data.finalBalance.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>`;

  openPrintWindow(buildPage(settings, 'كشف حساب', body));
}

export function printProductsTable(products: any[], settings: PharmacySettings) {
  const rowsHtml = products.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.batch_number || '—'}</td>
      <td>${p.trade_name}</td>
      <td>${p.scientific_name || ''}</td>
      <td>${p.category || ''}</td>
      <td>${p.packaging_type || ''}</td>
      <td>${Number(p.cost_price).toFixed(2)}</td>
      <td>${p.stock_quantity}</td>
      <td>${p.min_stock}</td>
      <td>${p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('en-GB') : '—'}</td>
    </tr>`).join('');

  const body = `
    <table>
      <thead><tr><th>#</th><th>Batch No</th><th>الاسم التجاري</th><th>الاسم العلمي</th><th>التصنيف</th><th>التعبئة</th><th>التكلفة</th><th>المخزون</th><th>الحد الأدنى</th><th>الصلاحية</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div style="margin-top:16px;font-size:14px;font-weight:600">إجمالي الأصناف: ${products.length} | قيمة المخزون: ${products.reduce((s: number, p: any) => s + Number(p.cost_price) * p.stock_quantity, 0).toFixed(2)} د.ل</div>`;

  openPrintWindow(buildPage(settings, 'جدول الأصناف', body));
}
