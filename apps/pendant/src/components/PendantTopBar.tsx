import Connection from 'app/features/Connection';
import { stopMachineMotion } from '@gsender/features/Jogging/utils/Jogging';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import {
    Circle,
    CircleCheck,
    CircleOff,
    DoorClosed,
    House,
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
    darkClasses: string;
    lightClasses: string;
    icon: ComponentType<{ className?: string }>;
    animation?: 'run' | 'alarm';
};

function useIsDark() {
    const [isDark, setIsDark] = useState(
        () => document.documentElement.classList.contains('dark')
    );
    useEffect(() => {
        const obs = new MutationObserver(() =>
            setIsDark(document.documentElement.classList.contains('dark'))
        );
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);
    return isDark;
}

const DISC_DARK  = 'bg-white/[0.04] border-white/[0.12] text-white/30';
const DISC_LIGHT = 'bg-slate-50 border-slate-300 text-slate-400';

const BADGE_DISCONNECTED: BadgeConfig = {
    label: 'Disconnected',
    darkClasses: DISC_DARK,
    lightClasses: DISC_LIGHT,
    icon: Unplug,
};

const BADGE_DEFAULT: BadgeConfig = {
    label: 'No State',
    darkClasses: DISC_DARK,
    lightClasses: DISC_LIGHT,
    icon: CircleOff,
};

const STATE_BADGES: Record<string, BadgeConfig> = {
    [GRBL_ACTIVE_STATE_IDLE]: {
        label: 'Idle',
        darkClasses:  'bg-gray-500/[0.12] border-gray-500/[0.45] text-gray-400',
        lightClasses: 'bg-slate-50 border-slate-300 text-slate-500',
        icon: Circle,
    },
    [GRBL_ACTIVE_STATE_RUN]: {
        label: 'Running',
        darkClasses:  'bg-green-600/[0.12] border-green-600/[0.6] text-green-400',
        lightClasses: 'bg-green-50 border-green-600 text-green-800',
        icon: Play,
        animation: 'run',
    },
    [GRBL_ACTIVE_STATE_JOG]: {
        label: 'Jogging',
        darkClasses:  'bg-green-600/[0.12] border-green-600/[0.6] text-green-400',
        lightClasses: 'bg-green-50 border-green-600 text-green-800',
        icon: Move,
        animation: 'run',
    },
    [GRBL_ACTIVE_STATE_CHECK]: {
        label: 'Check',
        darkClasses:  'bg-blue-600/[0.12] border-blue-600/[0.6] text-blue-400',
        lightClasses: 'bg-blue-50 border-blue-600 text-blue-900',
        icon: CircleCheck,
    },
    [GRBL_ACTIVE_STATE_HOME]: {
        label: 'Homing',
        darkClasses:  'bg-blue-600/[0.12] border-blue-600/[0.6] text-blue-400',
        lightClasses: 'bg-blue-50 border-blue-600 text-blue-900',
        icon: House,
    },
    [GRBL_ACTIVE_STATE_HOLD]: {
        label: 'Hold',
        darkClasses:  'bg-yellow-700/[0.15] border-yellow-500/[0.6] text-yellow-400',
        lightClasses: 'bg-amber-50 border-amber-600 text-amber-900',
        icon: Pause,
        animation: 'alarm',
    },
    [GRBL_ACTIVE_STATE_DOOR]: {
        label: 'Door',
        darkClasses:  'bg-yellow-700/[0.15] border-yellow-500/[0.6] text-yellow-400',
        lightClasses: 'bg-amber-50 border-amber-600 text-amber-900',
        icon: DoorClosed,
        animation: 'alarm',
    },
    [GRBL_ACTIVE_STATE_ALARM]: {
        label: 'Alarm',
        darkClasses:  'bg-red-700/[0.15] border-red-600/[0.65] text-red-400',
        lightClasses: 'bg-red-50 border-red-600 text-red-900',
        icon: TriangleAlert,
        animation: 'alarm',
    },
    [GRBL_ACTIVE_STATE_TOOL]: {
        label: 'Tool Change',
        darkClasses:  'bg-violet-600/[0.12] border-violet-500/[0.6] text-violet-300',
        lightClasses: 'bg-violet-50 border-violet-700 text-violet-900',
        icon: Wrench,
    },
    [GRBL_ACTIVE_STATE_SLEEP]: {
        label: 'Sleep',
        darkClasses:  'bg-[rgba(26,41,66,0.6)] border-[rgba(100,130,180,0.3)] text-[rgba(148,174,213,0.85)]',
        lightClasses: 'bg-slate-100 border-blue-300 text-blue-900',
        icon: Moon,
    },
    [GRBL_ACTIVE_STATE_TESTING]: {
        label: 'Testing',
        darkClasses:  'bg-indigo-600/[0.12] border-indigo-500/[0.6] text-indigo-300',
        lightClasses: 'bg-indigo-50 border-indigo-700 text-indigo-900',
        icon: FileSearch,
    },
};

export default function PendantTopBar() {
    const isDark = useIsDark();
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const controllerType = useTypedSelector((s: RootState) => s.controller.type);
    const rawState = useTypedSelector((s: RootState) => s.controller.state) as any;
    const activeState: string = rawState?.status?.activeState ?? '';
    const alarmCode: string | number = rawState?.status?.alarmCode ?? 0;
    const badge = !isConnected ? BADGE_DISCONNECTED : (STATE_BADGES[activeState] ?? BADGE_DEFAULT);
    const BadgeIcon = badge.icon;
    const showAlarmCode =
        isConnected &&
        activeState === GRBL_ACTIVE_STATE_ALARM &&
        alarmCode !== 0 &&
        alarmCode !== '0' &&
        alarmCode !== '';
    const badgeLabel = showAlarmCode ? `${badge.label} ${alarmCode}` : badge.label;
    const unlockActionable = isConnected && (activeState === GRBL_ACTIVE_STATE_HOLD || activeState === GRBL_ACTIVE_STATE_ALARM);
    const handleUnlock = () => {
        if (!isConnected) return;

        if (activeState === GRBL_ACTIVE_STATE_ALARM) {
            if (alarmCode === 1 || alarmCode === 2 || alarmCode === 10 || alarmCode === 14 || alarmCode === 17) {
                controller.command('reset:limit');
            } else if (alarmCode === 11 || alarmCode === 'Homing') {
                controller.command('homing');
            } else {
                controller.command('unlock');
            }
            return;
        }

        if (activeState === GRBL_ACTIVE_STATE_HOLD) {
            controller.command('cyclestart');
        }
    };
    const handleEStop = () => {
        if (!isConnected) return;
        stopMachineMotion(activeState, controllerType);
    };

    return (
        <header className="h-14 px-3 flex items-center gap-3 bg-gray-50 border-b border-gray-200 dark:bg-dark-darker dark:border-dark-lighter shrink-0 select-none relative drag-region">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
                <img src={iconRound} alt="gSender" className="w-9 h-9" />
            </div>

            {/* Connection widget from desktop */}
            <div className="shrink-0 no-drag">
                <Connection />
            </div>

            {/* State pill — absolutely centred so Connection resizing doesn't shift it */}
            <div
                className={[
                    'status-badge absolute left-1/2 -translate-x-1/2',
                    'flex items-center justify-center gap-2',
                    'w-[160px] h-10 px-4 rounded-full border border-[1.5px]',
                    'text-[15px] font-medium whitespace-nowrap pointer-events-none',
                    isDark ? badge.darkClasses : badge.lightClasses,
                    badge.animation === 'run'   ? 'badge-animate-run' : '',
                    badge.animation === 'alarm' ? 'state-attention'    : '',
                ].join(' ')}
            >
                <BadgeIcon size={17} className="shrink-0" />
                <span>{badgeLabel}</span>
            </div>

            {/* Spacer */}
            <div className="flex-1 h-full" />

            {/* Unlock + E-STOP */}
            <button
                onClick={handleUnlock}
                disabled={!unlockActionable}
                className={`w-[90px] flex items-center justify-center gap-2 font-bold px-3 py-2 rounded-lg text-sm transition-colors no-drag ${
                    unlockActionable
                        ? (alarmCode === 11 || alarmCode === 'Homing'
                            ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white unlock-attention-home'
                            : 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white unlock-attention')
                        : 'bg-gray-300 text-gray-600 dark:bg-dark-lighter dark:text-gray-400'
                }`}
            >
                {alarmCode === 11 || alarmCode === 'Homing' ? <House className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                {alarmCode === 11 || alarmCode === 'Homing' ? 'Home' : 'Unlock'}
            </button>
            <button
                type="button"
                onClick={handleEStop}
                disabled={!isConnected}
                className={`flex items-center gap-2 font-bold px-4 py-2 rounded-lg text-sm transition-colors no-drag ${isConnected ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white' : 'bg-gray-300 text-gray-600 dark:bg-dark-lighter dark:text-gray-400'}`}
            >
                <span>⊗</span> E-STOP
            </button>
        </header>
    );
}
