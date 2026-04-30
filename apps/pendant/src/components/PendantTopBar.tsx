import Connection from 'app/features/Connection';
import ThemeToggle from './ThemeToggle';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import iconRound from '../assets/icon-round.png';

const STATE_COLOR: Record<string, string> = {
    Idle:  'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-400 dark:border-green-700',
    Run:   'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-700',
    Hold:  'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-700',
    Alarm: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700',
    Door:  'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-700',
};
const DEFAULT_STATE_COLOR = 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';

export default function PendantTopBar() {
    const rawState = useTypedSelector((s: RootState) => s.controller.state) as any;
    const activeState: string = rawState?.status?.activeState ?? '';

    return (
        <header data-tauri-drag-region className="h-14 px-3 flex items-center gap-3 bg-gray-50 border-b border-gray-200 dark:bg-dark-darker dark:border-dark-lighter shrink-0 cursor-grab active:cursor-grabbing select-none">
            {/* Logo + name */}
            <div className="flex items-center gap-2 shrink-0">
                <img src={iconRound} alt="gSender" className="w-9 h-9" />
                <div className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">gSender</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Pendant v1.4.2</span>
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

            {/* Theme toggle + E-STOP */}
            <ThemeToggle />
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-4 py-2 rounded-lg text-sm">
                <span>⊗</span> E-STOP
            </button>
        </header>
    );
}
