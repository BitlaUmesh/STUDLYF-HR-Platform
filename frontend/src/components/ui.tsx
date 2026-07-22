import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import type { ApplicationStatus } from '../api/applications';
import { STATUS_LABELS } from '../api/applications';

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({
  className,
  hoverable = false,
  glow = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { hoverable?: boolean; glow?: boolean }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(15,23,42,0.04)]',
        hoverable && 'b2b-card-hover cursor-pointer',
        glow && 'ring-2 ring-[var(--color-primary)] ring-offset-2',
        className
      )}
      {...props}
    />
  );
}

// ── Button ─────────────────────────────────────────────────────────────────
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'xl';
  loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'xl' && 'px-6 py-3.5 text-base',
        variant === 'primary' &&
          'bg-[var(--color-primary-vivid)] text-white hover:bg-[var(--color-primary)] shadow-[0_1px_3px_rgba(67,56,202,0.35)] hover:shadow-[0_4px_12px_rgba(67,56,202,0.4)]',
        variant === 'secondary' &&
          'border border-[var(--color-line-strong)] bg-white text-[var(--color-text)] hover:bg-[var(--color-primary-tint)] hover:border-[var(--color-primary)]',
        variant === 'outline' &&
          'border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-transparent hover:bg-[var(--color-primary-tint)]',
        variant === 'ghost' &&
          'text-[var(--color-text-muted)] hover:bg-[var(--color-primary-tint)] hover:text-[var(--color-primary)]',
        variant === 'danger' &&
          'bg-[var(--color-signal-rejected)] text-white hover:opacity-90 shadow-[0_1px_3px_rgba(239,68,68,0.3)]',
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
export function Input({
  className,
  error,
  leftIcon,
  rightIcon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  error?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  if (leftIcon || rightIcon) {
    return (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {leftIcon}
          </span>
        )}
        <input
          className={clsx(
            'w-full rounded-lg border bg-white py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)] transition-all duration-150',
            'focus:ring-2 focus:ring-[var(--color-primary-tint)]',
            leftIcon ? 'pl-10 pr-3' : 'px-3',
            rightIcon ? 'pr-10' : '',
            error
              ? 'border-[var(--color-signal-rejected)] focus:border-[var(--color-signal-rejected)]'
              : 'border-[var(--color-line-strong)] focus:border-[var(--color-primary-vivid)]',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {rightIcon}
          </span>
        )}
        {typeof error === 'string' && error && (
          <p className="mt-1 text-xs text-[var(--color-signal-rejected)]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        className={clsx(
          'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)] transition-all duration-150',
          'focus:ring-2 focus:ring-[var(--color-primary-tint)]',
          error
            ? 'border-[var(--color-signal-rejected)] focus:border-[var(--color-signal-rejected)]'
            : 'border-[var(--color-line-strong)] focus:border-[var(--color-primary-vivid)]',
          className
        )}
        {...props}
      />
      {typeof error === 'string' && error && (
        <p className="mt-1 text-xs text-[var(--color-signal-rejected)]">{error}</p>
      )}
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-lg border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-subtle)] transition-all duration-150 focus:border-[var(--color-primary-vivid)] focus:ring-2 focus:ring-[var(--color-primary-tint)] resize-none',
        className
      )}
      {...props}
    />
  );
}

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
];

function getGradient(name?: string | null) {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

// ── Avatar ─────────────────────────────────────────────────────────────────
export function Avatar({
  src,
  name,
  size = 'md',
  className,
  showIndicator = false,
}: {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showIndicator?: boolean;
}) {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '??';

  const gradientClass = getGradient(name);

  return (
    <div className={clsx('relative shrink-0', className)}>
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={clsx('rounded-full object-cover ring-2 ring-white', sizeClasses[size])}
        />
      ) : (
        <div
          className={clsx(
            'flex items-center justify-center rounded-full font-bold text-white ring-2 ring-white bg-gradient-to-br',
            gradientClass,
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}
      {showIndicator && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({
  children,
  color = 'default',
  className,
}: {
  children: React.ReactNode;
  color?: 'default' | 'indigo' | 'green' | 'amber' | 'red' | 'blue' | 'violet';
  className?: string;
}) {
  const colorClasses = {
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    green:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    red:     'bg-red-50 text-red-700 border-red-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    violet:  'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

// ── StatusBadge ────────────────────────────────────────────────────────────
const STATUS_COLOR_VAR: Record<ApplicationStatus, string> = {
  invited:        'var(--color-signal-invited)',
  reviewing:      'var(--color-signal-reviewing)',
  questions_sent: 'var(--color-signal-questions)',
  offered:        'var(--color-signal-offered)',
  rejected:       'var(--color-signal-rejected)',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        color: STATUS_COLOR_VAR[status],
        backgroundColor: `color-mix(in srgb, ${STATUS_COLOR_VAR[status]} 10%, white)`,
        border: `1px solid color-mix(in srgb, ${STATUS_COLOR_VAR[status]} 20%, white)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: STATUS_COLOR_VAR[status] }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ── PageHeader ─────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 border-b border-[var(--color-line)] pb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center px-6">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-tint)] text-[var(--color-primary)]">
          {icon}
        </div>
      )}
      <p className="font-display text-base font-semibold text-[var(--color-ink)]">{title}</p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
