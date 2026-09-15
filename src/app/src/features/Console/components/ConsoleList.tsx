import { ArrowDown } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { ConsoleMessage } from '../definitions';
import { MessageIcon } from './MessageIcon';

/**
 * A job alternates command/reply the whole way down, so the two highest-volume
 * types are separated by weight rather than hue: what gSender sent reads as the
 * anchor line, what the machine answered sits back. Adding a colour here would
 * tint most of the console during a job.
 */
const TEXT_BY_TYPE: Record<string, string> = {
    gcode: 'text-gray-900 dark:text-content-primary',
    response: 'text-gray-500 dark:text-content-muted',
    warning: 'text-orange-600 dark:text-orange-300',
    error: 'text-red-600 dark:text-red-400',
    alarm: 'text-red-700 dark:text-red-500 font-medium',
    system: 'text-green-700 dark:text-green-300',
};

const DEFAULT_TEXT = 'text-gray-700 dark:text-content-secondary';

const SURFACE =
    'h-full rounded bg-white dark:bg-surface-sunken border border-gray-200 dark:border-white/10';

function ConsoleRow({ message }: { message: ConsoleMessage }) {
    return (
        <div className="flex items-start gap-2 px-2 py-1 min-h-[34px] border-b border-gray-100 dark:border-white/5">
            <span className="flex items-center justify-center w-4 shrink-0 pt-[3px]">
                <MessageIcon type={message.type} />
            </span>
            <span
                className={`console-text text-xs leading-[1.45] whitespace-pre-wrap break-words ${
                    TEXT_BY_TYPE[message.type] ?? DEFAULT_TEXT
                }`}
            >
                {message.message}
            </span>
        </div>
    );
}

function ConsoleLog({ messages }: { messages: ConsoleMessage[] }) {
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const scrollToLatest = useCallback(() => {
        virtuosoRef.current?.scrollToIndex({
            index: 'LAST',
            behavior: 'auto',
        });
    }, []);

    return (
        <div className={`relative overflow-hidden ${SURFACE}`}>
            <Virtuoso
                ref={virtuosoRef}
                data={messages}
                // Height goes in the inline style, not a Tailwind class: this
                // project sets `important: true`, so `h-full` would outrank
                // the inline sizing Virtuoso manages on its own scroller.
                className="console-scroll"
                style={{ height: '100%' }}
                // 'auto' rather than 'smooth': a streaming job appends
                // continuously and animating every append is just noise.
                followOutput={isAtBottom ? 'auto' : false}
                atBottomStateChange={setIsAtBottom}
                atBottomThreshold={24}
                // Open on the newest line, however much history is already
                // buffered.
                initialTopMostItemIndex={{ index: 'LAST', align: 'end' }}
                computeItemKey={(_index, message) => message.id}
                itemContent={(_index, message) => (
                    <ConsoleRow message={message} />
                )}
            />

            {!isAtBottom && (
                <button
                    type="button"
                    onClick={scrollToLatest}
                    aria-label="Scroll to latest message"
                    className="absolute bottom-2 right-3 flex items-center justify-center w-11 h-11 rounded-full shadow-lg bg-robin-500 text-white hover:bg-robin-600 active:bg-robin-700"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

type Props = {
    messages: ConsoleMessage[];
    isActive?: boolean;
    isFiltered?: boolean;
};

export function ConsoleList({
    messages,
    isActive = true,
    isFiltered = false,
}: Props) {
    // The tool tabs stay mounted and hide with display:none, where Virtuoso
    // measures a zero-height viewport. Keeping it unmounted while hidden means
    // it always mounts against a laid-out box, and re-enters on the newest
    // line rather than wherever the stale measurement left it.
    if (!isActive) {
        return <div className={SURFACE} />;
    }

    if (messages.length === 0) {
        return (
            <div className={`flex items-center justify-center ${SURFACE}`}>
                <span className="console-text text-xs italic text-gray-400 dark:text-content-muted">
                    {isFiltered
                        ? 'No messages match this filter'
                        : 'No console output yet'}
                </span>
            </div>
        );
    }

    return <ConsoleLog messages={messages} />;
}

export default ConsoleList;
