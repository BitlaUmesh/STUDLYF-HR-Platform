import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import type { ApplicationStatus } from '../api/applications';
import { STATUS_LABELS } from '../api/applications';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_1px_2px_rgba(20,16,42,0.04)]',
        className
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        variant === 'primary' && 'bg-[var(--color-primary-vivid)] text-white hover:bg-[var(--color-primary)]',
        variant === 'secondary' &&
          'border border-[var(--color-line-strong)] bg-white text-[var(--color-text)] hover:bg-[var(--color-primary-tint)]',
        variant === 'ghost' && 'text-[var(--color-text-muted)] hover:bg-[var(--color-primary-tint)]',
        variant === 'danger' && 'bg-[var(--color-signal-rejected)] text-white hover:opacity-90',
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border border-[var(--color-line-strong)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-vivid)] focus:ring-2 focus:ring-[var(--color-primary-tint)]',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-lg border border-[var(--color-line-strong)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-vivid)] focus:ring-2 focus:ring-[var(--color-primary-tint)]',
        className
      )}
      {...props}
    />
  );
}

const STATUS_COLOR_VAR: Record<ApplicationStatus, string> = {
  invited: 'var(--color-signal-invited)',
  reviewing: 'var(--color-signal-reviewing)',
  questions_sent: 'var(--color-signal-questions)',
  offered: 'var(--color-signal-offered)',
  rejected: 'var(--color-signal-rejected)',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color: STATUS_COLOR_VAR[status],
        backgroundColor: `color-mix(in srgb, ${STATUS_COLOR_VAR[status]} 12%, white)`,
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
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-base font-semibold text-[var(--color-ink)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">{description}</p>}
    </Card>
  );
}
