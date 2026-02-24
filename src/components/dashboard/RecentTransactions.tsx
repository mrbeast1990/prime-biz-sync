import { Invoice } from '@/types';
import { ArrowDownLeft, ArrowUpRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentTransactionsProps {
  invoices: Invoice[];
}

export function RecentTransactions({ invoices }: RecentTransactionsProps) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">آخر المعاملات</h3>
            <p className="text-sm text-muted-foreground">اليوم</p>
          </div>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">
          عرض الكل
        </button>
      </div>

      <div className="space-y-3">
        {invoices.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد معاملات</p>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    invoice.invoice_type === 'sale' ? 'bg-success/10' : 'bg-info/10'
                  )}
                >
                  {invoice.invoice_type === 'sale' ? (
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-info" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-card-foreground">{invoice.contact_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.id} • {invoice.items.length} منتج
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p
                  className={cn(
                    'font-bold tabular-nums',
                    invoice.invoice_type === 'sale' ? 'text-success' : 'text-info'
                  )}
                >
                  {invoice.invoice_type === 'sale' ? '+' : '-'}{invoice.total.toFixed(2)} د.ل
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(invoice.created_at).toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
