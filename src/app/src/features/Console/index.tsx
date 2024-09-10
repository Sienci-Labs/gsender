import { useTypedSelector } from 'hooks/useTypedSelector';

import Terminal from './Terminal';
import TerminalInput from './TerminalInput';

import './styles.css';

export const Console = () => {
    const { isConnected } = useTypedSelector((state) => state.connection);

    return (
        <>
            <div
                className={`absolute top-0 left-0 rounded-lg w-full h-full bg-gray-50 z-10 transition-opacity duration-300 ${isConnected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className="flex justify-center items-center h-full">
                    Not connected to a device
                </div>
            </div>
            <div className="grid grid-rows-[5fr_1fr] absolute gap-2 top-0 left-0 w-full h-full p-1">
                <Terminal />
                <TerminalInput />
            </div>
        </>
    );
};
