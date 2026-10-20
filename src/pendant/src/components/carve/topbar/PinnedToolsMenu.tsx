import type { ToolEntry } from 'app/features/ToolsPage/registry';
import { usePinnedTools } from 'app/features/ToolsPage/usePinnedTools';
import cn from 'classnames';
import { useEffect, useState } from 'react';
import { TbStarFilled } from 'react-icons/tb';

/** Top-bar star that drops down the tools pinned from the Tools tab. Renders
 * nothing when no tools are pinned. */
export default function PinnedToolsMenu({
    onOpen,
    disabled,
}: {
    onOpen: (tool: ToolEntry) => void;
    disabled: boolean;
}) {
    const { pinnedTools } = usePinnedTools({ pendant: true });
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    if (pinnedTools.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                disabled={disabled}
                aria-label="Pinned tools"
                aria-expanded={open}
                className={cn(
                    'h-[30px] px-2.5 rounded-md border flex items-center justify-center transition-colors',
                    disabled
                        ? 'bg-transparent border-outline-strong text-content-disabled'
                        : 'border-outline-strong text-amber-400 active:bg-robin-600/[0.12]',
                    open && 'bg-robin-600/[0.12]',
                )}
            >
                <TbStarFilled className="w-3.5 h-3.5" />
            </button>

            {open && (
                <>
                    {/* Transparent catch layer: a tap outside closes the menu */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="conn-anim-dropdown-in origin-top-right absolute top-full right-0 mt-2 z-50 min-w-48 py-1 rounded-lg border border-outline bg-surface-elevated shadow-2xl overflow-hidden">
                        {pinnedTools.map((tool) => {
                            const Icon = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        onOpen(tool);
                                    }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left font-mono text-[10.5px] font-semibold tracking-[0.06em] uppercase text-content-primary active:bg-robin-600/[0.12]"
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    {tool.title}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
