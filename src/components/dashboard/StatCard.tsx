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
        'rounded-xl p-5 md:p-6 shadow-card card-hover border border-border/60',
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs md:text-sm font-medium', isGradient ? 'opacity-90' : 'text-muted-foreground')}>
            {title}
          </p>
          <p
            className={cn(
              'mt-2 text-2xl md:text-3xl font-bold tabular-nums break-all leading-tight',
              !isGradient && 'text-highlight'
            )}
          >
            {value}
          </p>
          {trend && (
            <p className={cn('mt-2 text-sm', isGradient ? 'opacity-80' : trend.isPositive ? 'text-success' : 'text-destructive')}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="mr-1">مقارنة بالأمس</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
            isGradient ? 'bg-white/20' : 'bg-primary/10 text-primary'
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
