import { useEffect, useRef, useState } from 'react';

import { toast } from 'app/lib/toaster';

import Terminal from './Terminal';
import TerminalInput from './TerminalInput';

import './styles.css';
import { ConsolePopout } from 'app/features/Console/components/ConsolePopout.tsx';
import isElectron from 'is-electron';
import controller from 'app/lib/controller';
import { FIRMWARE_TYPES_T } from 'app/definitions/firmware';

type ConsoleProps = {
    isActive: boolean;
    isChildWindow: boolean;
};

const Console = ({ isActive, isChildWindow }: ConsoleProps) => {
    const terminalRef = useRef<{ clear: () => void }>(null);
    const [port, setPort] = useState(controller.port);

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
                controller.addClient(port);
            }
        },
        'serialport:close': () => {
            setPort('');
        },
    };

    const handleTerminalClear = () => {
        if (terminalRef.current) {
            terminalRef.current.clear();

            toast.info('Console cleared', { position: 'bottom-left' });
        }
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
                    controller.addClient(port);

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
                    controller.addClient(port);

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
                className={`absolute top-0 left-0 rounded-lg w-full h-full bg-gray-50 z-10 transition-opacity dark:text-white dark:bg-dark
                    duration-300 ${port !== '' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className="flex justify-center items-center h-full ">
                    <h2 className="text-lg font-bold">
                        Not connected to a device
                    </h2>
                </div>
            </div>
            <div className="grid grid-rows-[1fr_auto] absolute gap-2 top-0 left-0 w-full h-full p-1">
                <Terminal ref={terminalRef} isActive={isActive} />
                <TerminalInput onClear={handleTerminalClear} />
                <ConsolePopout />
            </div>
        </>
    );
};

export default Console;
