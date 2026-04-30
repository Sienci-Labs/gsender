import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { BsUsbPlug, BsEthernet } from 'react-icons/bs';
import { GrSatellite } from 'react-icons/gr';
import { PiPlugLight } from 'react-icons/pi';

function connectionIcon(port: string | null, isConnected: boolean) {
    if (!isConnected || !port) return <PiPlugLight className="text-lg" />;
    if (/^\d{1,3}\.\d{1,3}/.test(port)) return <BsEthernet className="text-lg" />;
    if (port.toLowerCase().includes('net') || port.toLowerCase().includes('remote'))
        return <GrSatellite className="text-lg" />;
    return <BsUsbPlug className="text-lg" />;
}

export default function ConnectionBar() {
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const port = useTypedSelector((s: RootState) => s.connection.port);
    const controllerType = useTypedSelector((s: RootState) => s.controller.type);

    return (
        <div className={`flex items-center gap-3 px-5 py-3 text-sm font-medium shrink-0 border-b border-gray-700 ${isConnected ? 'bg-gray-800' : 'bg-gray-900'}`}>
            <span className={`text-xl ${isConnected ? 'text-green-400' : 'text-gray-500'}`}>
                {connectionIcon(port, isConnected)}
            </span>
            <span className={`flex-1 ${isConnected ? 'text-white' : 'text-gray-500'}`}>
                {isConnected ? port : 'Not connected'}
            </span>
            {isConnected && controllerType && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/60 text-blue-300 uppercase tracking-wide">
                    {controllerType}
                </span>
            )}
        </div>
    );
}
