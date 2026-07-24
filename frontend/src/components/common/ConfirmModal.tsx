import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '../ui';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              variant === 'danger'
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : variant === 'warning'
                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 size={22} />
            ) : (
              <AlertTriangle size={22} />
            )}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1 pt-0.5">
            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl font-bold"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            loading={loading}
            className="rounded-xl font-bold"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
