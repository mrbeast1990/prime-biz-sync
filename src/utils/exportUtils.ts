import { Product } from '@/types';

export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  
  const escapeField = (val: string) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvContent = [
    headers.map(escapeField).join(','),
    ...data.map(row => headers.map(h => escapeField(String(row[h] ?? ''))).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportProductsToCSV(products: Product[]) {
  const rows = products.map(p => ({
    'الكود': p.barcode || '',
    'الاسم التجاري': p.trade_name,
    'الاسم العلمي': p.scientific_name || '',
    'التصنيف': p.category || '',
    'التعبئة': p.packaging_type || '',
    'الوحدات': p.units_per_package ?? 1,
    'سعر التكلفة': p.cost_price,
    'سعر البيع': p.sale_price,
    'المخزون': p.stock_quantity,
    'الحد الأدنى': p.min_stock,
    'خاضع للصلاحية': p.has_expiry ? 'نعم' : 'لا',
  }));
  exportToCSV(rows, `منتجات_${new Date().toISOString().slice(0, 10)}`);
}

export function exportToPrintPDF(title: string, tableId: string) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
    <title>${title}</title>
    <style>
      body { font-family: 'Cairo', sans-serif; padding: 20px; direction: rtl; }
      h1 { text-align: center; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
      th { background-color: #f5f5f5; font-weight: bold; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style></head><body>
    <h1>${title}</h1>
    ${table.outerHTML}
    <script>window.print(); window.close();</script>
    </body></html>
  `);
  printWindow.document.close();
}

const HEADER_MAP: Record<string, string> = {
  'الكود': 'barcode',
  'الاسم التجاري': 'trade_name',
  'الاسم العلمي': 'scientific_name',
  'التصنيف': 'category',
  'التعبئة': 'packaging_type',
  'الوحدات': 'units_per_package',
  'سعر التكلفة': 'cost_price',
  'سعر البيع': 'sale_price',
  'المخزون': 'stock_quantity',
  'الحد الأدنى': 'min_stock',
  'خاضع للصلاحية': 'has_expiry',
  'barcode': 'barcode',
  'trade_name': 'trade_name',
  'scientific_name': 'scientific_name',
  'category': 'category',
  'packaging_type': 'packaging_type',
  'units_per_package': 'units_per_package',
  'cost_price': 'cost_price',
  'sale_price': 'sale_price',
  'stock_quantity': 'stock_quantity',
  'min_stock': 'min_stock',
  'has_expiry': 'has_expiry',
};

export function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] || '').trim();
    });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',' || ch === '\t') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export function mapCSVToProducts(rows: Record<string, string>[]): Partial<Product>[] {
  return rows.map(row => {
    const mapped: Record<string, any> = {};
    for (const [csvHeader, value] of Object.entries(row)) {
      const field = HEADER_MAP[csvHeader];
      if (field) mapped[field] = value;
    }

    const hasExpiryVal = mapped.has_expiry;
    const hasExpiry = hasExpiryVal === 'نعم' || hasExpiryVal === 'true' || hasExpiryVal === '1';

    return {
      barcode: mapped.barcode || null,
      trade_name: mapped.trade_name || '',
      scientific_name: mapped.scientific_name || null,
      category: mapped.category || null,
      packaging_type: mapped.packaging_type || 'علبة',
      units_per_package: parseInt(mapped.units_per_package) || 1,
      cost_price: parseFloat(mapped.cost_price) || 0,
      sale_price: parseFloat(mapped.sale_price) || 0,
      stock_quantity: parseInt(mapped.stock_quantity) || 0,
      min_stock: parseInt(mapped.min_stock) || 0,
      has_expiry: hasExpiry,
    } as Partial<Product>;
  });
}
