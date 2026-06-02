import { useCallback } from 'react';
import { clsx } from 'clsx';
import { FaShower, FaBan } from 'react-icons/fa6';
import { FaWater } from 'react-icons/fa';
import { startMist, startFlood, stopCoolant } from 'app/features/Coolant/utils/actions';
import { GRBL, GRBLHAL, WORKFLOW_STATE_RUNNING, GRBL_ACTIVE_STATE_IDLE } from 'app/constants';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import ensureArray from 'ensure-array';
import includes from 'lodash/includes';
import get from 'lodash/get';

// ── CoolantButton ──────────────────────────────────────────────────────────────

interface CoolantButtonProps {
    label: string;
    Icon: React.ComponentType<{ size?: number }>;
    active: boolean;
    disabled: boolean;
    onClick: () => void;
}

function CoolantButton({ label, Icon, active, disabled, onClick }: CoolantButtonProps) {
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
                    'bg-gray-100 dark:bg-dark',
                    'border-gray-300 dark:border-dark-lighter',
                    active
                        ? 'text-robin-500 shadow-[inset_7px_4px_6px_0px_rgba(59,130,246,0.12)] border-robin-400 dark:border-robin-600'
                        : 'text-[#7a8299] dark:text-white/50',
                    {
                        'opacity-40': disabled,
                        'hover:bg-gray-200 dark:hover:bg-dark-lighter': !disabled && !active,
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
    const { workflow, isConnected, controllerState, controllerType } =
        useTypedSelector((s: RootState) => ({
            workflow:        s.controller.workflow,
            isConnected:     s.connection.isConnected ?? false,
            controllerState: s.controller.state ?? {},
            controllerType:  s.controller.type ?? 'grbl',
        }));

    const coolantModal: string = useTypedSelector((s: RootState) =>
        get(s, 'controller.modal.coolant', 'M9'),
    );

    const coolantArray = ensureArray(coolantModal);
    const mistActive   = includes(coolantArray, 'M7');
    const floodActive  = includes(coolantArray, 'M8');

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (![GRBL, GRBLHAL].includes(controllerType)) return false;
        return (controllerState as any)?.status?.activeState === GRBL_ACTIVE_STATE_IDLE;
    }, [isConnected, workflow.state, controllerType, controllerState]);

    const clickable = canClick();

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
