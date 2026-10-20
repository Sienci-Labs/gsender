import * as Popover from '@radix-ui/react-popover';
import type { ToolEntry } from 'app/features/ToolsPage/registry';
import { usePinnedTools } from 'app/features/ToolsPage/usePinnedTools';
import cn from 'classnames';
import { Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** Visualizer-tray star that pops out the tools pinned from the Tools tab.
 * Renders nothing when no tools are pinned. */
export default function PinnedToolsMenu({
    onOpen,
    disabled,
    className,
}: {
    onOpen: (tool: ToolEntry) => void;
    disabled: boolean;
    className?: string;
}) {
    const { pinnedTools } = usePinnedTools({ pendant: true });
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    // The stage clips overflow, so the menu portals into the themed screen
    // wrapper instead (keeps the workshop dark tokens)
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    if (pinnedTools.length === 0) {
        return null;
    }

    return (
        <Popover.Root
            open={open}
            onOpenChange={(next) => {
                if (next) {
                    setContainer(
                        triggerRef.current?.closest<HTMLElement>(
                            '[data-dark-theme]',
                        ) ?? null,
                    );
                }
                setOpen(next);
            }}
        >
            <Popover.Trigger asChild>
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    aria-label="Pinned tools"
                    className={cn(
                        className,
                        'data-[state=open]:border-outline-subtle data-[state=open]:text-content-primary',
                    )}
                >
                    <Star className="h-5 w-5" aria-hidden />
                </button>
            </Popover.Trigger>
            <Popover.Portal container={container}>
                <Popover.Content
                    side="right"
                    align="center"
                    sideOffset={10}
                    collisionPadding={8}
                    className="z-50 min-w-48 py-1 rounded-lg border border-outline bg-surface-elevated shadow-2xl overflow-hidden"
                >
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
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
