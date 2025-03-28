import { useEffect, useRef } from 'react';

import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { toast } from 'app/lib/toaster';

import Terminal from './Terminal';
import TerminalInput from './TerminalInput';

import './styles.css';
import { ConsolePopout } from 'app/features/Console/components/ConsolePopout.tsx';
import isElectron from 'is-electron';

type ConsoleProps = {
    isActive: boolean;
};

const Console = ({ isActive }: ConsoleProps) => {
    const { isConnected } = useTypedSelector((state) => state.connection);
    const terminalRef = useRef<{ clear: () => void }>(null);

    const handleTerminalClear = () => {
        if (terminalRef.current) {
            terminalRef.current.clear();

            toast.info('Console cleared', { position: 'bottom-left' });
        }
    };

    function registerIPCListeners() {
        // send state of this console to the new window
        window.ipcRenderer.on('get-data-console', (event) => {
            const data = { state: this.state, port: controller.port };
            window.ipcRenderer.send('receive-data', {
                widget: 'console',
                data: data,
            });
        });
    }

    useEffect(() => {
        if (isElectron()) {
            registerIPCListeners();
        }
    }, []);

    return (
        <>
            <div
                className={`absolute top-0 left-0 rounded-lg w-full h-full bg-gray-50 z-10 transition-opacity dark:text-white dark:bg-dark
                    duration-300 ${isConnected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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
