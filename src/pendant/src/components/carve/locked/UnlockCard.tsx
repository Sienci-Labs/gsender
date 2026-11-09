import cn from 'classnames';
import type { ReactNode } from 'react';

type ActionTone = 'unlock' | 'home' | 'secondary';

const ACTION_TONE: Record<ActionTone, string> = {
    unlock: 'bg-action-unlock border-transparent text-content-inverse',
    home: 'bg-blue-600 border-transparent text-white',
    secondary: 'bg-blue-500/[0.18] border-blue-500 text-blue-400',
};

export interface UnlockAction {
    label: string;
    tone: ActionTone;
    onClick: () => void;
    disabled?: boolean;
}

/** The right-column card for locked states: content, then the way out. */
export default function UnlockCard({
    children,
    actions,
}: {
    children: ReactNode;
    actions: UnlockAction[];
}) {
    return (
        <div className="flex flex-1 flex-col gap-3 min-h-0 p-3.5 rounded-lg border border-outline-subtle bg-surface-raised">
            {/* Content scrolls; the way out stays pinned in view */}
            <div className="flex flex-1 flex-col gap-3 min-h-0 overflow-auto">
                {children}
            </div>
            <div className="flex flex-col gap-[7px] shrink-0 pt-1">
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                            'py-[11px] rounded-md border text-[12.5px] font-bold text-center transition-[filter] active:brightness-90 disabled:opacity-50',
                            ACTION_TONE[action.tone],
                        )}
                    >
                        {action.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
