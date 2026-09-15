import { cn } from 'app/lib/utils';

type AccessoryStatus = 'connected' | 'disconnected';

interface AccessoryConnectivityToastProps {
    status: AccessoryStatus;
    accessoryName: string;
    onDismiss: () => void;
}

const SUBTITLE: Record<AccessoryStatus, string> = {
    connected: 'Ready to use',
    disconnected: 'Connection lost',
};

function LinkIcon() {
    return (
        <svg
            className="size-14"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.35}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M25 39l-4 4a10 10 0 0 1-14-14l8-8a10 10 0 0 1 14 0" />
            <path d="M39 25l4-4a10 10 0 0 1 14 14l-8 8a10 10 0 0 1-14 0" />
            <path d="M23 41l18-18" />
        </svg>
    );
}

function UnlinkIcon() {
    return (
        <svg
            className="size-14"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.35}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M24 40l-3 3a10 10 0 0 1-14-14l7-7" />
            <path d="M40 24l3-3a10 10 0 0 1 14 14l-7 7" />
            <path d="M24 24l-6-6" />
            <path d="M40 40l6 6" />
            <path d="M28 36l8-8" />
        </svg>
    );
}

function CheckBadgeIcon() {
    return (
        <svg
            className="size-[18px]"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m4 10 4 4 8-9" />
        </svg>
    );
}

function XBadgeIcon() {
    return (
        <svg
            className="size-[18px]"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m5 5 10 10M15 5 5 15" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg
            className="size-[22px]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M5 5 19 19M19 5 5 19" />
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg
            className="size-[17px]"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m7 4 6 6-6 6" />
        </svg>
    );
}

export function AccessoryConnectivityToast({
    status,
    accessoryName,
    onDismiss,
}: AccessoryConnectivityToastProps) {
    const isConnected = status === 'connected';
    const title = `${accessoryName} ${status}`;
    const subtitle = SUBTITLE[status];
    // Matches tailwind.config.ts `green.500` / `red.500` — not exposed as a
    // CSS var, so mirrored here for the color-mix()-based layers below.
    const accentColor = isConnected ? '#059669' : '#dc2626';

    return (
        <article
            className={cn(
                // Positioning/stacking is owned by AccessoryConnectivityToastHost,
                // which renders this outside sonner's toast pipeline entirely —
                // sonner's toast-container box is sized/anchored for its default
                // compact toasts and can't cleanly host a card this large.
                'relative isolate grid w-[calc(100vw-32px)] grid-cols-[86px_1fr] items-center gap-5 overflow-hidden rounded-[22px] border border-border bg-card py-5 pr-4 pl-6 shadow-[0_21px_42px_-23px_rgba(0,0,0,0.82)] sm:w-[552px] sm:grid-cols-[106px_1fr] sm:gap-8 sm:py-7 sm:pr-6 sm:pl-7',
            )}
            style={{ ['--accent' as string]: accentColor }}
            aria-label={title}
        >
            <div
                className="pointer-events-none absolute inset-y-[-1px] left-[-1px] z-[3] w-1.5 rounded-l-[22px]"
                style={{ background: 'var(--accent)' }}
            />
            <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    background: `radial-gradient(105% 112% at 0% 52%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, color-mix(in srgb, var(--accent) 5%, transparent) 16%, color-mix(in srgb, var(--accent) 3%, transparent) 28%, transparent 52%), linear-gradient(90deg, color-mix(in srgb, var(--accent) 2.5%, transparent) 0%, transparent 40%)`,
                    opacity: 0.34,
                }}
            />

            <div
                className={cn(
                    'relative z-[1] grid size-[86px] shrink-0 place-items-center rounded-full border border-black/[0.09] bg-black/[0.02] text-foreground sm:size-[106px] dark:border-white/[0.095] dark:bg-white/[0.035]',
                )}
                style={
                    !isConnected
                        ? {
                              background:
                                  'color-mix(in srgb, var(--accent) 7%, transparent)',
                              borderColor:
                                  'color-mix(in srgb, var(--accent) 13%, rgba(0,0,0,0.09))',
                          }
                        : undefined
                }
                aria-hidden="true"
            >
                {isConnected ? <LinkIcon /> : <UnlinkIcon />}
                <span
                    className="absolute right-[-6px] bottom-[-3px] grid size-[34px] place-items-center rounded-full text-white shadow-[0_0_0_4px_var(--card),0_5px_12px_-5px_rgba(0,0,0,0.5)]"
                    style={{ background: 'var(--accent)' }}
                >
                    {isConnected ? <CheckBadgeIcon /> : <XBadgeIcon />}
                </span>
            </div>

            <div className="relative z-[1] min-w-0 self-center">
                <h2 className="m-0 text-xl leading-tight font-bold tracking-tight text-foreground sm:text-2xl">
                    {title}
                </h2>
                <p className="mt-2.5 text-base leading-tight text-muted-foreground sm:text-xl">
                    {subtitle}
                </p>
                {isConnected && (
                    <div className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground sm:text-lg">
                        <span
                            className="size-[7px] shrink-0 rounded-full"
                            style={{ background: '#059669' }}
                        />
                        <span>Device available</span>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onDismiss}
                aria-label={`Dismiss ${title.toLowerCase()} notification`}
                className="absolute top-4 right-4 z-[4] grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-ring sm:top-6 sm:right-6"
            >
                <CloseIcon />
            </button>

            {isConnected && (
                <button
                    type="button"
                    onClick={() => {}}
                    className="absolute right-5 bottom-5 z-[4] inline-flex h-[43px] min-w-[122px] items-center justify-center gap-3 rounded-full bg-purple-100 px-4 text-sm font-semibold text-purple-600 hover:bg-purple-200 focus-visible:ring-2 focus-visible:ring-ring sm:h-[49px] sm:min-w-[143px] sm:text-base dark:bg-purple-600/70 dark:text-white dark:hover:bg-purple-600/85"
                >
                    Manage
                    <ChevronIcon />
                </button>
            )}
        </article>
    );
}
