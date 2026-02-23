export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
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
