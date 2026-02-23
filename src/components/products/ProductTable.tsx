import { Product } from '@/types';
import { Edit, Trash2, MoreVertical, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const isLowStock = (product: Product) => product.stock_quantity <= product.min_stock;
  // Expiry is now tracked per batch, not per product

  return (
    <div className="rounded-xl bg-card shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الكود</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الصنف</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الاسم العلمي</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">التعبئة</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">المخزون</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">سعر التكلفة</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">سعر البيع</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الصلاحية</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.id}
                className={cn(
                  'border-b border-border table-row-hover',
                  index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                )}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-muted-foreground">{product.barcode}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {product.image_url && (
                      <img src={product.image_url} alt={product.trade_name} className="h-8 w-8 rounded object-cover" />
                    )}
                    <div>
                      <span className="font-medium text-card-foreground">{product.trade_name}</span>
                    {isLowStock(product) && (
                        <AlertTriangle className="inline-block mr-1 h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{product.scientific_name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {product.packaging_type} ({product.units_per_package})
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tabular-nums',
                      isLowStock(product)
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-success/10 text-success'
                    )}
                  >
                    {product.stock_quantity}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{product.cost_price.toFixed(2)} د.ل</td>
                <td className="px-4 py-3 tabular-nums font-medium text-card-foreground">{product.sale_price.toFixed(2)} د.ل</td>
                <td className="px-4 py-3">
                  {product.has_expiry ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
                      خاضع للصلاحية
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(product)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="ml-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
