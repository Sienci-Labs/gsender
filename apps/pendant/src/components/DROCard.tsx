import { useState } from 'react';
import cn from 'classnames';
import { Home, Target, Crosshair } from 'lucide-react';
import get from 'lodash/get';
import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { goXYAxes, gotoZero, homeMachine, zeroAllAxes, zeroWCS } from '@gsender/features/DRO/utils/DRO';
import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';

const AXES = [
    { label: 'X', color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
    { label: 'Y', color: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' },
    { label: 'Z', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { label: 'A', color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
] as const;

function formatAxisValue(value: unknown): string {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(3) : '0.000';
}

export default function DROCard() {
    const [mode, setMode] = useState<'work' | 'machine'>('work');
    const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
    const workflowState = useTypedSelector((s: RootState) => s.controller.workflow.state);
    const activeState = useTypedSelector((s: RootState) => s.controller.state.status?.activeState ?? '');
    const homingEnabled = useTypedSelector((s: RootState) =>
        Number(get(s, 'controller.settings.settings.$22', 0)) > 0,
    );
    const wpos = useTypedSelector((s: RootState) => s.controller.wpos);
    const mpos = useTypedSelector((s: RootState) => s.controller.mpos);
    const activePos = !isConnected
        ? { x: 0, y: 0, z: 0, a: 0 }
        : mode === 'machine'
            ? mpos
            : wpos;
    const alarmCode = useTypedSelector((s: RootState) => s.controller.state.status?.alarmCode ?? 0) as string | number;
    const isHomingAlarm = activeState === GRBL_ACTIVE_STATE_ALARM && (alarmCode === 11 || alarmCode === 'Homing');
    const canZero =
        isConnected &&
        workflowState !== WORKFLOW_STATE_RUNNING &&
        (activeState === GRBL_ACTIVE_STATE_IDLE ||
            activeState === GRBL_ACTIVE_STATE_JOG);
    const canGoTo = canZero;
    const canHome = (canGoTo && homingEnabled) || isHomingAlarm;

    return (
        <div className="rounded-xl bg-white border border-gray-300 dark:bg-dark-darker dark:border-dark-lighter p-3 flex flex-col gap-3">
            {/* Work / Machine toggle */}
            <div className="flex gap-1 self-end">
                {(['work', 'machine'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide transition-colors ${
                            mode === m
                                ? 'bg-robin-500 text-white'
                                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Axis rows */}
            <div className="flex flex-col gap-1.5">
                {AXES.map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-dark">
                        <button
                            type="button"
                            aria-label={`Go to ${label} axis`}
                            onClick={() => gotoZero(label)}
                            disabled={!canGoTo}
                            className={`w-9 h-9 rounded flex items-center justify-center text-base font-bold shrink-0 transition-colors ${
                                canGoTo
                                    ? `hover:brightness-95 active:brightness-90 ${color}`
                                    : 'bg-gray-200 text-gray-400 dark:bg-dark-lighter dark:text-gray-500 cursor-default'
                            }`}
                        >
                            {label}
                        </button>
                        <span className={cn(
                            'flex-1 min-w-0 text-right font-mono text-[2rem] tabular-nums leading-tight',
                            mode === 'work' ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500',
                        )}>
                            {formatAxisValue(activePos?.[label.toLowerCase() as 'x' | 'y' | 'z' | 'a'])}
                        </span>
                        <button
                            onClick={() => zeroWCS(label, 0)}
                            disabled={!canZero}
                            className={`text-sm font-semibold border rounded-md px-3 py-1.5 shrink-0 transition-colors ${
                                canZero
                                    ? 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-gray-200 dark:border-dark-lighter'
                                    : 'text-gray-400 dark:text-gray-500 border-gray-200 dark:border-dark-lighter cursor-default'
                            }`}
                        >
                            ZERO
                        </button>
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                    { icon: Home, label: 'Home', primary: true },
                    { icon: Target, label: 'Go to XY', primary: true },
                    { icon: Crosshair, label: 'Zero All', primary: false },
                ].map(({ icon: Icon, label, primary }) => (
                    <button
                        key={label}
                        onClick={
                            label === 'Home'
                                ? homeMachine
                                : label === 'Zero All'
                                ? zeroAllAxes
                                : label === 'Go to XY'
                                    ? goXYAxes
                                    : undefined
                        }
                        disabled={
                            label === 'Home'
                                ? !canHome
                                : label === 'Go to XY'
                                ? !canGoTo
                                : primary
                                    ? !isConnected
                                    : !canZero
                        }
                        className={`flex items-center justify-center gap-2 rounded-lg h-12 text-sm border transition-colors ${
                            primary
                                ? ((label === 'Home' ? canHome : label === 'Go to XY' ? canGoTo : isConnected)
                                    ? 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 border-blue-500 text-white'
                                    : 'bg-gray-200 border-gray-200 text-gray-400 dark:bg-dark-lighter dark:border-dark-lighter dark:text-gray-500')
                                : (canZero
                                    ? 'border-gray-200 dark:border-dark-lighter text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-lighter hover:text-gray-900 dark:hover:text-white'
                                    : 'border-gray-200 dark:border-dark-lighter text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark cursor-default')
                        }`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}
