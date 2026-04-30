import Connection from 'app/features/Connection';
import { Wifi, Bell } from 'lucide-react';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import iconRound from '../assets/icon-round.png';

const STATE_COLOR: Record<string, string> = {
    Idle:  'bg-green-900/40 text-green-400 border-green-700',
    Run:   'bg-blue-900/40 text-blue-400 border-blue-700',
    Hold:  'bg-yellow-900/40 text-yellow-400 border-yellow-700',
    Alarm: 'bg-red-900/40 text-red-400 border-red-700',
    Door:  'bg-orange-900/40 text-orange-400 border-orange-700',
};
const DEFAULT_STATE_COLOR = 'bg-gray-800 text-gray-400 border-gray-600';

export default function PendantTopBar() {
    const rawState = useTypedSelector((s: RootState) => s.controller.state) as any;
    const activeState: string = rawState?.status?.activeState ?? '';

    return (
        <header className="h-14 px-3 flex items-center gap-3 bg-dark-darker border-b border-dark-lighter shrink-0">
            {/* Logo + name */}
            <div className="flex items-center gap-2 shrink-0">
                <img src={iconRound} alt="gSender" className="w-9 h-9" />
                <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-white">gSender</span>
                    <span className="text-[10px] text-gray-500">Pendant v1.4.2</span>
                </div>
            </div>

            {/* Connection widget from desktop */}
            <div className="shrink-0">
                <Connection />
            </div>

            {/* State pill */}
            {activeState && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide shrink-0 ${STATE_COLOR[activeState] ?? DEFAULT_STATE_COLOR}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    STATE {activeState}
                </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Icons + E-STOP */}
            <button className="text-gray-400 hover:text-white p-2 rounded-lg">
                <Wifi size={20} />
            </button>
            <button className="text-gray-400 hover:text-white p-2 rounded-lg">
                <Bell size={20} />
            </button>
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-4 py-2 rounded-lg text-sm">
                <span>⊗</span> E-STOP
            </button>
        </header>
    );
}
