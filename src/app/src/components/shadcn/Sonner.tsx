import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { Toaster as Sonner } from 'sonner';
import { toastIcons } from './ToastIcon';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    const { enableDarkMode = false } = useWorkspaceState();

    return (
        <Sonner
            theme={enableDarkMode ? 'dark' : 'light'}
            className="toaster group"
            icons={toastIcons}
            toastOptions={{
                unstyled: true,
                closeButtonAriaLabel: 'Dismiss notification',
                classNames: {
                    toast: 'group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-border bg-background px-4 py-3.5 text-foreground shadow-[0_8px_20px_rgb(15_23_42_/_0.10),0_2px_6px_rgb(15_23_42_/_0.06)] dark:shadow-[0_10px_24px_rgb(0_0_0_/_0.28),0_2px_6px_rgb(0_0_0_/_0.20)]',
                    title: 'text-[14px] text-foreground leading-5',
                    description:
                        'text-[14px] font-normal leading-5 text-muted-foreground',
                    content:
                        'flex min-w-0 flex-1 flex-col justify-center gap-0.5',
                    icon: 'mx-0 flex size-11 shrink-0 items-center justify-center rounded-full',
                    closeButton:
                        'static order-last ml-auto flex size-9 shrink-0 translate-x-0 translate-y-0 items-center justify-center rounded-full border-0 bg-transparent text-muted-foreground opacity-100 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring',
                    actionButton:
                        'static order-3 ml-2 flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-transparent px-3 text-xs font-medium text-foreground hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring',
                    cancelButton:
                        'flex h-9 items-center justify-center rounded-md px-3 bg-muted text-muted-foreground',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
