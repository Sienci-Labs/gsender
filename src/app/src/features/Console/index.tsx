import { useTypedSelector } from 'app/hooks/useTypedSelector';

import Terminal from './Terminal';
import TerminalInput from './TerminalInput';

import './styles.css';

type Props = {
    isActive: boolean;
};

const Console = ({ isActive }: Props) => {
    const { isConnected } = useTypedSelector((state) => state.connection);

    return (
        <>
            <div
                className={`absolute top-0 left-0 rounded-lg w-full h-full bg-gray-50 z-10 transition-opacity duration-300 ${isConnected ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <div className="flex justify-center items-center h-full">
                    <h2 className="text-lg font-bold">
                        Not connected to a device
                    </h2>
                </div>
            </div>
            <div className="grid grid-rows-[1fr_auto] absolute gap-2 top-0 left-0 w-full h-full p-1">
                <Terminal isActive={isActive} />
                <TerminalInput />
            </div>
        </>
    );
};

export default Console;
