import { cn } from 'app/lib/utils';
import {
    CheckCircle,
    CircleAlert,
    Info,
    Loader2,
    TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';

type ToastVariant =
    | 'success'
    | 'info'
    | 'warning'
    | 'error'
    | 'loading'
    | 'default';

const variantClasses: Record<ToastVariant, string> = {
    success: 'bg-green-500/10 text-green-500',
    info: 'bg-blue-500/10 text-blue-500',
    warning: 'bg-orange-500/10 text-orange-500',
    error: 'bg-red-500/10 text-red-500',
    loading: 'bg-blue-500/10 text-blue-500',
    default: 'bg-muted text-muted-foreground',
};

function ToastIconShell({
    variant,
    children,
}: {
    variant: ToastVariant;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-full',
                variantClasses[variant],
            )}
        >
            {children}
        </div>
    );
}

// Keyed as a plain Record (not sonner's ToastIcons type) so the "default"
// key - used for plain toast(msg) calls with no variant - doesn't trip
// TypeScript's excess-property check against ToastIcons.
export const toastIcons: Record<string, ReactNode> = {
    success: (
        <ToastIconShell variant="success">
            <CheckCircle className="size-6" />
        </ToastIconShell>
    ),
    info: (
        <ToastIconShell variant="info">
            <Info className="size-6" />
        </ToastIconShell>
    ),
    warning: (
        <ToastIconShell variant="warning">
            <TriangleAlert className="size-6" />
        </ToastIconShell>
    ),
    error: (
        <ToastIconShell variant="error">
            <CircleAlert className="size-6" />
        </ToastIconShell>
    ),
    loading: (
        <ToastIconShell variant="loading">
            <Loader2 className="size-6 animate-spin" />
        </ToastIconShell>
    ),
    default: (
        <ToastIconShell variant="default">
            <Info className="size-6" />
        </ToastIconShell>
    ),
};
