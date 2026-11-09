import {
    startFlood,
    startMist,
    stopCoolant,
} from 'app/features/Coolant/utils/actions';
import { clsx } from 'clsx';
import { FaWater } from 'react-icons/fa';
import { FaBan, FaShower } from 'react-icons/fa6';
import { useCoolant } from '../hooks/useCoolant';

// ── CoolantButton ──────────────────────────────────────────────────────────────

interface CoolantButtonProps {
    label: string;
    Icon: React.ComponentType<{ size?: number }>;
    active: boolean;
    disabled: boolean;
    onClick: () => void;
}

function CoolantButton({
    label,
    Icon,
    active,
    disabled,
    onClick,
}: CoolantButtonProps) {
    return (
        <div
            className={clsx(
                'flex-1 relative rounded-xl border border-transparent p-[1px] overflow-hidden select-none',
                disabled ? 'cursor-default' : 'cursor-pointer',
            )}
            onClick={disabled ? undefined : onClick}
        >
            {/* Rotating gradient ring — only rendered when active */}
            <div
                className={clsx(
                    'animate-rotatef absolute inset-0 rounded-full',
                    'bg-[conic-gradient(transparent_0deg,theme(colors.robin.500)_120deg,theme(colors.robin.500)_140deg,transparent_140deg)]',
                    { 'bg-none': !active },
                )}
            />

            {/* Inner face */}
            <div
                className={clsx(
                    'relative z-10 flex flex-col items-center justify-center gap-2 rounded-xl',
                    'min-h-[80px] px-2 py-4',
                    'border transition-colors',
                    'bg-gray-100 dark:bg-surface-elevated',
                    'border-gray-300 dark:border-outline',
                    active
                        ? 'text-robin-500 shadow-[inset_7px_4px_6px_0px_rgba(104,154,201,0.12)] border-robin-400 dark:border-robin-600'
                        : 'text-gray-600 dark:text-content-muted',
                    {
                        'opacity-40': disabled,
                        'hover:bg-gray-200 dark:hover:bg-surface-hover':
                            !disabled && !active,
                    },
                )}
            >
                <Icon size={24} />
                <span className="text-[11px] font-semibold">{label}</span>
            </div>
        </div>
    );
}

// ── CoolantPanel ───────────────────────────────────────────────────────────────

export default function CoolantPanel() {
    const { isConnected, mistActive, floodActive, clickable } = useCoolant();

    return (
        <div className="h-full flex items-center justify-center px-4 py-3 gap-3">
            <CoolantButton
                label="Mist"
                Icon={FaShower}
                active={isConnected && mistActive}
                disabled={!clickable}
                onClick={startMist}
            />
            <CoolantButton
                label="Flood"
                Icon={FaWater}
                active={isConnected && floodActive}
                disabled={!clickable}
                onClick={startFlood}
            />
            <CoolantButton
                label="Off"
                Icon={FaBan}
                active={false}
                disabled={!clickable}
                onClick={stopCoolant}
            />
        </div>
    );
}
