import { ConsoleList } from 'app/features/Console/components/ConsoleList';
import { ConsoleToolbar } from 'app/features/Console/components/ConsoleToolbar';
import { clearConsole, getMessages } from 'app/features/Console/consoleStore';
import {
    type ConsoleFilter,
    matchesFilter,
} from 'app/features/Console/definitions';
import { useConsoleMessages } from 'app/features/Console/useConsoleMessages';
import { toast } from 'app/lib/toaster';
import { useMemo, useState } from 'react';
import 'app/features/Console/styles.css';

const COPY_HISTORY_LIMIT = 50;

/** The desktop console's toolbar and log with no command input: watching a
 * running job, not typing into it. Copy/Clear match the desktop handlers. */
export default function ReadOnlyConsole() {
    const [filter, setFilter] = useState<ConsoleFilter>('all');
    const messages = useConsoleMessages();

    const visibleMessages = useMemo(
        () =>
            filter === 'all'
                ? messages
                : messages.filter((message) => matchesFilter(message, filter)),
        [messages, filter],
    );

    const handleClear = () => {
        clearConsole();
        toast.info('Console cleared', { position: 'bottom-right' });
    };

    const handleCopy = async () => {
        const lastMessages = getMessages().slice(-COPY_HISTORY_LIMIT);
        if (lastMessages.length === 0) {
            return;
        }
        try {
            await navigator.clipboard.writeText(
                lastMessages.map((item) => item.message).join('\n'),
            );
            toast.success(
                `Copied last ${lastMessages.length} commands to clipboard`,
                { duration: 3000, position: 'bottom-right' },
            );
        } catch (error) {
            toast.error('Failed to copy commands to clipboard', {
                duration: 3000,
                position: 'bottom-right',
            });
            console.error('Failed to copy commands to clipboard:', error);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-1.5">
            <ConsoleToolbar
                filter={filter}
                onFilterChange={setFilter}
                onCopy={handleCopy}
                onClear={handleClear}
                showPopout={false}
            />
            <div className="relative flex-1 min-h-0">
                <ConsoleList
                    messages={visibleMessages}
                    isFiltered={filter !== 'all'}
                />
            </div>
        </div>
    );
}
