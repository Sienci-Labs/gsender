import get from 'lodash/get';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';

const STATE_STYLES: Record<string, string> = {
    Idle:    'text-green-400  border-green-400/30  bg-green-400/10',
    Run:     'text-blue-400   border-blue-400/30   bg-blue-400/10',
    Hold:    'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    Alarm:   'text-red-400    border-red-400/30    bg-red-400/10',
    Door:    'text-orange-400 border-orange-400/30 bg-orange-400/10',
    Home:    'text-blue-300   border-blue-300/30   bg-blue-300/10',
    Check:   'text-gray-400   border-gray-400/30   bg-gray-400/10',
    Sleep:   'text-purple-400 border-purple-400/30 bg-purple-400/10',
};

const DEFAULT_STATE = 'text-gray-400 border-gray-400/30 bg-gray-400/10';

export default function MachineStatus() {
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const controllerType = useTypedSelector((s: RootState) => s.controller.type);
    const rawState = useTypedSelector((s: RootState) => s.controller.state);
    const activeState: string = get(rawState, 'status.activeState', '') as string;

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
                <span className="text-5xl">⊘</span>
                <span className="text-xl font-medium">Waiting for connection</span>
            </div>
        );
    }

    const stateLabel = activeState || 'Unknown';
    const stateStyle = STATE_STYLES[stateLabel] ?? DEFAULT_STATE;

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8">
            {/* Active state pill */}
            <div className={`flex items-center justify-center w-64 py-6 rounded-2xl border-2 ${stateStyle}`}>
                <span className="text-5xl font-bold tracking-wide uppercase">
                    {stateLabel}
                </span>
            </div>

            {/* Controller type */}
            {controllerType && (
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Controller</span>
                    <span className="text-2xl font-semibold text-gray-200">{controllerType}</span>
                </div>
            )}
        </div>
    );
}
