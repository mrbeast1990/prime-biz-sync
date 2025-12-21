import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
  className?: string;
}

export function StatCard({ title, value, icon, trend, variant = 'default', className }: StatCardProps) {
  const variants = {
    default: 'bg-card text-card-foreground',
    primary: 'stat-card-primary text-primary-foreground',
    success: 'stat-card-success text-success-foreground',
    warning: 'stat-card-warning text-warning-foreground',
  };

  const isGradient = variant !== 'default';

  return (
    <div
      className={cn(
        'rounded-xl p-6 shadow-card card-hover',
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-sm font-medium', isGradient ? 'opacity-90' : 'text-muted-foreground')}>
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          {trend && (
            <p className={cn('mt-2 text-sm', isGradient ? 'opacity-80' : trend.isPositive ? 'text-success' : 'text-destructive')}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="mr-1">مقارنة بالأمس</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            isGradient ? 'bg-white/20' : 'bg-primary/10'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
