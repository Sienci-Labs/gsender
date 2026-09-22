import { usePostHog } from '@posthog/react';
import type { FIRMWARE_TYPES_T } from 'app/definitions/firmware';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import isElectron from 'is-electron';
import { Unplug } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ConsoleInput } from './components/ConsoleInput';
import { ConsoleList } from './components/ConsoleList';
import { ConsoleToolbar } from './components/ConsoleToolbar';
import { clearConsole, getMessages } from './consoleStore';
import { type ConsoleFilter, matchesFilter } from './definitions';
import { useConsoleMessages } from './useConsoleMessages';

import './styles.css';

const COPY_HISTORY_LIMIT = 50;

type ConsoleProps = {
    isActive: boolean;
    isChildWindow?: boolean;
};

const Console = ({ isActive, isChildWindow }: ConsoleProps) => {
    const [port, setPort] = useState(controller.port);
    const [filter, setFilter] = useState<ConsoleFilter>('all');
    const posthog = usePostHog();

    // Joining a port makes the server send this window another
    // 'serialport:open', which would ask us to join again. Track what we have
    // already joined so the pop-out settles after the first round trip.
    const joinedPort = useRef<string | null>(null);

    const joinPort = (nextPort: string) => {
        if (!nextPort || joinedPort.current === nextPort) {
            return;
        }

        joinedPort.current = nextPort;
        controller.addClient(nextPort);
    };

    const messages = useConsoleMessages();

    const visibleMessages = useMemo(
        () =>
            filter === 'all'
                ? messages
                : messages.filter((message) => matchesFilter(message, filter)),
        [messages, filter],
    );

    const controllerEvents: {
        [key: string]: Function;
    } = {
        'serialport:open': (options: {
            port: string;
            baudrate: string;
            controllerType: FIRMWARE_TYPES_T;
            inuse: boolean;
        }) => {
            const { port } = options;
            setPort(port);
            if (isChildWindow) {
                joinPort(port);
            }
        },
        'serialport:close': () => {
            joinedPort.current = null;
            setPort('');
        },
    };

    const handleClear = () => {
        clearConsole();

        toast.info('Console cleared', { position: 'bottom-right' });

        posthog?.capture('console_cleared');
    };

    // Copies the raw stream rather than the current view, so a filtered
    // console still yields the last 50 lines the machine actually saw.
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
                {
                    duration: 3000,
                    position: 'bottom-right',
                },
            );

            posthog?.capture('console_history_copied', {
                commands: lastMessages.map((item) => item.message),
            });
        } catch (error) {
            toast.error('Failed to copy commands to clipboard', {
                duration: 3000,
                position: 'bottom-right',
            });
            console.error('Failed to copy commands to clipboard:', error);
        }
    };

    const handlePopout = () => {
        if (!isElectron()) {
            toast.info('This functionality is not available on web view.', {
                position: 'bottom-right',
            });
            return;
        }

        window.ipcRenderer.send('open-new-window', '/console');
        posthog?.capture('console_popout_opened');
    };

    function registerIPCListeners() {
        if (!isChildWindow) {
            // send state of this console to the new window
            window.ipcRenderer.on('get-data-console', () => {
                const data = { port: controller.port };
                window.ipcRenderer.send('receive-data', {
                    widget: 'console',
                    data: data,
                });
            });
        } else {
            // recieve state of console and controller port from main window
            window.ipcRenderer.on(
                'recieve-data-console',
                (_: string, data: { port: string }) => {
                    const { port } = data;
                    // set port
                    controller.port = port;
                    // add client
                    joinPort(port);

                    setPort(port);
                },
            );
            window.ipcRenderer.on(
                'reconnect',
                (
                    _: string,
                    options: { port: string; type: FIRMWARE_TYPES_T },
                ) => {
                    const { port, type } = options;
                    // set port
                    controller.port = port;
                    controller.type = type;
                    // add client
                    joinPort(port);

                    setPort(port);
                },
            );
        }
    }

    const addControllerEvents = () => {
        Object.keys(controllerEvents).forEach((eventName) => {
            const callback = controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    };

    const removeControllerEvents = () => {
        Object.keys(controllerEvents).forEach((eventName) => {
            const callback = controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    };

    useEffect(() => {
        if (isElectron()) {
            registerIPCListeners();
            if (isChildWindow) {
                // ask main window for data for component we are about to render
                window.ipcRenderer.send('get-data', 'console');
            }
        }

        addControllerEvents();

        return () => {
            removeControllerEvents();
        };
    }, []);

    return (
        <>
            <div
                className={`absolute top-0 left-0 rounded-lg w-full h-full bg-gray-50 z-10 transition-opacity dark:text-content-primary dark:bg-surface-raised
                    duration-300 ${port !== '' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className="flex flex-col justify-center items-center gap-2 h-full text-gray-500 dark:text-content-muted">
                    <Unplug className="h-12 w-12" />
                    <span className="text-sm">Not connected to a device</span>
                </div>
            </div>
            <div className="grid grid-rows-[auto_1fr_auto] absolute gap-1 top-0 left-0 w-full h-full p-1">
                <ConsoleToolbar
                    filter={filter}
                    onFilterChange={setFilter}
                    onCopy={handleCopy}
                    onClear={handleClear}
                    onPopout={handlePopout}
                    showPopout={!isChildWindow}
                />
                <ConsoleList
                    messages={visibleMessages}
                    isActive={isActive}
                    isFiltered={filter !== 'all' && messages.length > 0}
                />
                <ConsoleInput />
            </div>
        </>
    );
};

export default Console;
