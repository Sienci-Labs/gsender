import Connection from 'app/features/Connection';
import ThemeToggle from './ThemeToggle';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { ComponentType, MouseEvent } from 'react';
import {
    Circle,
    CircleCheck,
    DoorClosed,
    House,
    Minus,
    Moon,
    Move,
    Pause,
    Play,
    TriangleAlert,
    Unplug,
    Wrench,
    FileSearch,
    LockOpen,
} from 'lucide-react';
import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_CHECK,
    GRBL_ACTIVE_STATE_DOOR,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_HOME,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    GRBL_ACTIVE_STATE_RUN,
    GRBL_ACTIVE_STATE_SLEEP,
    GRBL_ACTIVE_STATE_TESTING,
    GRBL_ACTIVE_STATE_TOOL,
} from 'app/constants';
import controller from '@gsender/controller-client/controller';
import iconRound from '../assets/icon-round.png';

type BadgeConfig = {
    label: string;
    classes: string;
    icon: ComponentType<{ className?: string }>;
    animation?: 'alarm' | 'run';
};

const BADGE_DISCONNECTED: BadgeConfig = {
    label: 'Disconnected',
    classes: 'bg-[#1A2942] text-white',
    icon: Unplug,
};

const BADGE_DEFAULT: BadgeConfig = {
    label: 'No State',
    classes: 'text-white bg-gray-800',
    icon: Minus,
};

const STATE_BADGES: Record<string, BadgeConfig> = {
    [GRBL_ACTIVE_STATE_IDLE]: { label: 'Idle', classes: 'bg-gray-500 text-white', icon: Circle },
    [GRBL_ACTIVE_STATE_RUN]: { label: 'Running', classes: 'bg-green-600 text-white', icon: Play, animation: 'run' },
    [GRBL_ACTIVE_STATE_JOG]: { label: 'Jogging', classes: 'bg-green-600 text-white', icon: Move },
    [GRBL_ACTIVE_STATE_CHECK]: { label: 'Check', classes: 'bg-green-600 text-white', icon: CircleCheck },
    [GRBL_ACTIVE_STATE_HOME]: { label: 'Homing', classes: 'bg-blue-500 text-white', icon: House },
    [GRBL_ACTIVE_STATE_HOLD]: { label: 'Hold', classes: 'bg-yellow-600 text-white', icon: Pause },
    [GRBL_ACTIVE_STATE_DOOR]: { label: 'Door', classes: 'bg-yellow-600 text-white', icon: DoorClosed },
    [GRBL_ACTIVE_STATE_ALARM]: { label: 'Alarm', classes: 'bg-red-500 text-white', icon: TriangleAlert, animation: 'alarm' },
    [GRBL_ACTIVE_STATE_TOOL]: { label: 'Tool Change', classes: 'bg-purple-600 text-white', icon: Wrench },
    [GRBL_ACTIVE_STATE_SLEEP]: { label: 'Sleep', classes: 'bg-[#1A2942] text-white', icon: Moon },
    [GRBL_ACTIVE_STATE_TESTING]: { label: 'Testing', classes: 'bg-indigo-600 text-white', icon: FileSearch },
};

export default function PendantTopBar() {
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const rawState = useTypedSelector((s: RootState) => s.controller.state) as any;
    const activeState: string = rawState?.status?.activeState ?? '';
    const alarmCode: string | number = rawState?.status?.alarmCode ?? 0;
    const badge = !isConnected ? BADGE_DISCONNECTED : (STATE_BADGES[activeState] ?? BADGE_DEFAULT);
    const BadgeIcon = badge.icon;
    const unlockActionable = isConnected && (activeState === GRBL_ACTIVE_STATE_HOLD || activeState === GRBL_ACTIVE_STATE_ALARM);
    const handleDragMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        if (event.button !== 0) return; // left mouse only
        // Fallback for environments where data-tauri-drag-region is unreliable.
        // In browser (non-Tauri), this safely no-ops.
        getCurrentWindow().startDragging().catch((err) => {
            console.warn('Unable to start window drag', err);
        });
    };
    const handleUnlock = () => {
        if (!isConnected) return;

        if (activeState === GRBL_ACTIVE_STATE_ALARM) {
            if (alarmCode === 17 || alarmCode === 10) {
                controller.command('reset:limit');
            } else {
                controller.command('unlock');
            }

            if (alarmCode === 11 || alarmCode === 'Homing') {
                controller.command('populateConfig');
            }
            return;
        }

        if (activeState === GRBL_ACTIVE_STATE_HOLD) {
            controller.command('cyclestart');
        }
    };

    return (
        <header className="h-14 px-3 flex items-center gap-3 bg-gray-50 border-b border-gray-200 dark:bg-dark-darker dark:border-dark-lighter shrink-0 select-none">
            {/* Logo */}
            <div data-tauri-drag-region className="flex items-center gap-2 shrink-0 cursor-grab active:cursor-grabbing">
                <img src={iconRound} alt="gSender" className="w-9 h-9" />
            </div>

            {/* Connection widget from desktop */}
            <div className="shrink-0">
                <Connection />
            </div>

            {/* State pill */}
            <div
                data-tauri-drag-region
                className={`status-badge flex items-center justify-center gap-2 w-44 h-9 px-3 rounded-full text-sm font-semibold shrink-0 whitespace-nowrap cursor-grab active:cursor-grabbing ${badge.classes} ${badge.animation === 'alarm' ? 'animate-pulse' : ''} ${badge.animation === 'run' ? 'status-badge--run' : ''}`}
            >
                <BadgeIcon className="w-4 h-4 shrink-0" />
                <span>{badge.label}</span>
            </div>

            {/* Spacer */}
            <div
                data-tauri-drag-region
                className="flex-1 h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleDragMouseDown}
            />

            {/* Theme toggle + unlock + E-STOP */}
            <ThemeToggle />
            <button
                onClick={handleUnlock}
                disabled={!unlockActionable}
                className={`flex items-center gap-2 font-bold px-3 py-2 rounded-lg text-sm transition-colors ${unlockActionable ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white' : 'bg-gray-300 text-gray-600 dark:bg-dark-lighter dark:text-gray-400'}`}
            >
                <LockOpen className="w-4 h-4" />
                Unlock
            </button>
            <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-4 py-2 rounded-lg text-sm">
                <span>⊗</span> E-STOP
            </button>
        </header>
    );
}
