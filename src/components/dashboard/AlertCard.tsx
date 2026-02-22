import { AlertTriangle, Clock, Package } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface AlertCardProps {
  title: string;
  type: 'lowStock' | 'expiring';
  products: Product[];
}

export function AlertCard({ title, type, products }: AlertCardProps) {
  const isLowStock = type === 'lowStock';

  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isLowStock ? 'bg-destructive/10' : 'bg-warning/10'
            )}
          >
            {isLowStock ? (
              <Package className="h-5 w-5 text-destructive" />
            ) : (
              <Clock className="h-5 w-5 text-warning" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{products.length} منتج</p>
          </div>
        </div>
        <AlertTriangle
          className={cn('h-5 w-5', isLowStock ? 'text-destructive' : 'text-warning')}
        />
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
        {products.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد تنبيهات</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <div>
                <p className="font-medium text-card-foreground">{product.trade_name}</p>
                <p className="text-xs text-muted-foreground">{product.scientific_name}</p>
              </div>
              <div className="text-left">
                {isLowStock ? (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      product.stock_quantity <= 5 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                    )}
                  >
                    {product.stock_quantity} قطعة
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                    {new Date(product.expiry_date).toLocaleDateString('ar-SA')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
