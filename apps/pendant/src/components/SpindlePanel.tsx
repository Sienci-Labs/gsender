import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { clsx } from 'clsx';
import debounce from 'lodash/debounce';
import findIndex from 'lodash/findIndex';
import pubsub from 'pubsub-js';
import { RotateCw, RotateCcw, Square, Lightbulb, Timer, LightbulbOff } from 'lucide-react';
import Select from 'react-select';

import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import { updatePartialControllerSettings, clearSpindles } from '@gsender/controller-client/store/redux/slices/controller.slice';
import { Slider } from '@gsender/ui/shadcn/Slider';

import store from 'app/store';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { getThemeCssColor } from 'app/lib/getThemeCssColor';
import controller from '@gsender/controller-client/controller';
import WidgetConfig from 'app/features/WidgetConfig/WidgetConfig';
import { convertToImperial } from 'app/lib/units';
import { roundMetric, round } from 'app/lib/rounding';
import { firmwarePastVersion } from 'app/lib/firmwareSemver';
import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants';
import {
    GRBL, GRBLHAL, GRBL_ACTIVE_STATE_IDLE, IMPERIAL_UNITS,
    LASER_MODE, SPINDLE_MODE, WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { UNITS_EN, UNITS_GCODE } from 'app/definitions/general';

// ── Types ──────────────────────────────────────────────────────────────────────

type SpindleLaserT = 'spindle' | 'laser';
type DrawerMode = 'closed' | 'minimal' | 'expanded';

interface SpindleState {
    mode: SpindleLaserT;
    spindleSpeed: number;
    laser: { duration: number; power: number; maxPower: number };
    spindleMax: number;
    spindleMin: number;
}

interface Props { mode: DrawerMode }

// ── SpindleButton ──────────────────────────────────────────────────────────────

interface SpindleButtonProps {
    label: string;
    Icon: React.ComponentType<{ size?: number }>;
    active?: boolean;
    danger?: boolean;
    disabled: boolean;
    onClick: () => void;
}

function SpindleButton({ label, Icon, active = false, danger = false, disabled, onClick }: SpindleButtonProps) {
    return (
        <div
            className={clsx('flex-1 relative rounded-xl border border-transparent p-[1px] overflow-hidden select-none',
                disabled ? 'cursor-default' : 'cursor-pointer')}
            onClick={disabled ? undefined : onClick}
        >
            {/* Rotating gradient ring — primary active only */}
            {!danger && (
                <div className={clsx(
                    'animate-rotatef absolute inset-0 rounded-full',
                    'bg-[conic-gradient(transparent_0deg,theme(colors.robin.500)_120deg,theme(colors.robin.500)_140deg,transparent_140deg)]',
                    { 'bg-none': !active },
                )} />
            )}

            {/* Inner face */}
            <div className={clsx(
                'relative z-10 flex flex-col items-center justify-center gap-2 rounded-xl',
                'min-h-[80px] px-2 py-4 border transition-colors',
                danger
                    ? 'bg-red-950/40 border-red-800/50'
                    : 'bg-gray-100 dark:bg-dark border-gray-300 dark:border-outline',
                active && !danger
                    ? 'text-robin-500 shadow-[inset_7px_4px_6px_0px_rgba(59,130,246,0.12)] border-robin-400 dark:border-robin-600'
                    : danger
                        ? 'text-red-400'
                        : 'text-gray-500 dark:text-content-muted',
                { 'opacity-40': disabled },
                !disabled && !active && !danger && 'hover:bg-gray-200 dark:hover:bg-surface-hover',
            )}>
                <Icon size={24} />
                <span className="text-[11px] font-semibold">{label}</span>
            </div>
        </div>
    );
}

// ── SpindlePanel ───────────────────────────────────────────────────────────────

export default function SpindlePanel({ mode }: Props) {
    const dispatch = useDispatch();
    const config = new WidgetConfig('spindle');

    const [state, setState] = useState<SpindleState>(() => ({
        mode: config.get('mode', ''),
        spindleSpeed: config.get('speed', 1000),
        laser: config.get('laser', { duration: 0, power: 0, maxPower: 0 }),
        spindleMax: config.get('spindleMax', 0),
        spindleMin: config.get('spindleMin', 0),
    }));

    const stateRef = useRef<SpindleState>(state);
    const [isLaserOn, setIsLaserOn] = useState(false);
    const [isSpindleOn, setIsSpindleOn] = useState(false);
    const pendingSpindleIdRef = useRef<string | number | null>(null);
    const lastKnownSpindleRef = useRef<{ label: string; id: string | number; enabled: boolean; capabilities: string; laser: boolean; raw: string; order: number } | null>(null);

    const {
        workflow, isConnected, controllerState, controllerType,
        spindleModal, spindleMin, spindleMax, laserAsSpindle,
        wcs, wpos, units, availableSpindles, $13, laserMax, laserMin,
        laserXOffset, laserYOffset,
    } = useTypedSelector((s: RootState) => ({
        workflow:          s.controller.workflow,
        isConnected:       s.connection.isConnected ?? false,
        controllerState:   s.controller.state ?? {},
        controllerType:    s.controller.type ?? 'grbl',
        spindleModal:      s.controller.modal.spindle ?? 'M5',
        spindleMin:        Number(s.controller.settings.settings.$31 ?? 1000),
        spindleMax:        Number(s.controller.settings.settings.$30 ?? 30000),
        laserAsSpindle:    Number(s.controller.settings.settings.$32 ?? 0),
        wcs:               s.controller.modal.wcs ?? '',
        wpos:              s.controller.wpos ?? { x: 0, y: 0 },
        units:             s.controller.modal.units ?? {},
        availableSpindles: s.controller.spindles ?? [],
        $13:               s.controller.settings.settings.$13 ?? '0',
        laserMax:          Number(s.controller.settings.settings.$730 ?? 255),
        laserMin:          Number(s.controller.settings.settings.$731 ?? 0),
        laserXOffset:      Number(s.controller.settings.settings.$741 ?? 0),
        laserYOffset:      Number(s.controller.settings.settings.$742 ?? 0),
    }));

    const fallbackSpindle = { label: 'Default Spindle', id: '0', enabled: true, capabilities: '', laser: false, raw: '', order: 0 };
    const enabledSpindle = availableSpindles.find((s: any) => s.enabled) ?? null;
    const pendingSpindle = pendingSpindleIdRef.current !== null
        ? (availableSpindles.find((s: any) => s.id === pendingSpindleIdRef.current) ?? null)
        : null;
    const spindle = enabledSpindle ?? pendingSpindle ?? lastKnownSpindleRef.current ?? fallbackSpindle;

    // Pubsub subscriptions
    useEffect(() => {
        const tokens = [
            pubsub.subscribe('laser:updated', (_: string, data: Partial<SpindleState['laser']>) => {
                setState((prev) => ({ ...prev, laser: { ...prev.laser, ...data } }));
            }),
            pubsub.subscribe('spindle:updated', (_: string, data: { spindleMax: number; spindleMin: number }) => {
                setState((prev) => ({ ...prev, spindleMax: data.spindleMax, spindleMin: data.spindleMin }));
            }),
        ];
        return () => tokens.forEach((t) => pubsub.unsubscribe(t));
    }, []);

    // Config persistence + speed clamping
    useEffect(() => {
        config.set('laser.duration', state.laser.duration);
        config.set('laser.power', state.laser.power);
        config.set('mode', state.mode);

        if (state.mode === SPINDLE_MODE && !laserAsSpindle) {
            let newSpeed = state.spindleSpeed;
            if (newSpeed > spindleMax) newSpeed = spindleMax;
            else if (newSpeed < spindleMin) newSpeed = spindleMin;
            config.set('speed', newSpeed);
            updateSpindleSpeed(newSpeed);
        }

        if (spindleMax !== state.spindleMax || spindleMin !== state.spindleMin) {
            setState((prev) => ({ ...prev, spindleMax, spindleMin }));
        }
    }, [state, laserAsSpindle, spindleMax, spindleMin]);

    // Keep stateRef in sync
    useEffect(() => { stateRef.current = state; }, [state]);

    // Track enabled spindle
    useEffect(() => {
        if (enabledSpindle) {
            lastKnownSpindleRef.current = enabledSpindle;
            if (pendingSpindleIdRef.current === enabledSpindle.id) pendingSpindleIdRef.current = null;
            return;
        }
        if (pendingSpindle) lastKnownSpindleRef.current = pendingSpindle;
    }, [enabledSpindle, pendingSpindle]);

    // Clear refs on disconnect
    useEffect(() => {
        if (!isConnected) {
            pendingSpindleIdRef.current = null;
            lastKnownSpindleRef.current = null;
        }
    }, [isConnected]);

    const updateSpindleSpeed = useCallback((speed: number) => {
        if (state.spindleSpeed !== speed) {
            setState((prev) => ({ ...prev, spindleSpeed: speed }));
            if (isSpindleOn) debounceSpindleSpeed(speed);
        }
    }, [state.spindleSpeed, isSpindleOn]);

    const debounceSpindleSpeed = useCallback(
        debounce((speed: number) => controller.command('spindlespeed:change', speed), 300),
        [],
    );

    const debounceLaserPower = useCallback(
        debounce((power: number, maxPower: number) => controller.command('laserpower:change', power, maxPower), 300),
        [],
    );

    const updateControllerSettings = useCallback((max: number, min: number, mode: string) => {
        dispatch(updatePartialControllerSettings({ $30: max.toString(), $31: min.toString(), $32: `${mode}` }));
    }, [dispatch]);

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (![GRBL, GRBLHAL].includes(controllerType)) return false;
        return (controllerState as { status?: { activeState?: string } })?.status?.activeState === GRBL_ACTIVE_STATE_IDLE;
    }, [isConnected, workflow.state, controllerType, controllerState]);

    const getSpindleActiveState = useCallback(() => spindleModal !== 'M5', [spindleModal]);

    // Laser offset code (for laser → spindle switch)
    const getLaserOffsetCode = (preferredUnits: UNITS_GCODE | UNITS_EN): string[] => {
        const laser = config.get('laser', { maxPower: 0, minPower: 0 });
        setState((prev) => ({ ...prev, laser }));

        let { xOffset, yOffset } = laser;
        if (controllerType === GRBLHAL) { xOffset = laserXOffset; yOffset = laserYOffset; }

        if (preferredUnits === 'G20') {
            xOffset = convertToImperial(xOffset);
            yOffset = convertToImperial(yOffset);
        } else {
            xOffset = roundMetric(xOffset);
            yOffset = roundMetric(yOffset);
        }

        const currentWCS = actions.getWCS();
        const [xa, ya] = actions.calculateAdjustedOffsets(xOffset, yOffset, preferredUnits);

        if (xOffset === 0 && yOffset !== 0) return [`G10 L20 P${currentWCS} Y${ya}`];
        if (xOffset !== 0 && yOffset === 0) return [`G10 L20 P${currentWCS} X${xa}`];
        if (xOffset !== 0 && yOffset !== 0) return [`G10 L20 P${currentWCS} X${xa} Y${ya}`];
        return [''];
    };

    // Full enableSpindleMode — ported verbatim from desktop (lines 352-406)
    const enableSpindleMode = () => {
        const preferredUnits: UNITS_GCODE | UNITS_EN = store.get('workspace.units') === IMPERIAL_UNITS ? 'G20' : 'G21';
        const active = getSpindleActiveState();

        const prevSpindleMin = config.get('spindleMin', 0);
        const prevSpindleMax = config.get('spindleMax', 0);

        const SLBLaserExists = controllerType === GRBLHAL && findIndex(availableSpindles, (o: any) => o.label === 'SLB_LASER') !== -1;

        if (!SLBLaserExists) {
            let laser = config.get('laser', { maxPower: 0, minPower: 0 });
            laser.maxPower = spindleMax;
            laser.minPower = spindleMin;
            config.set('laser', laser);
        }

        const powerCommands = SLBLaserExists ? [] : [`$30=${prevSpindleMax}`, `$31=${prevSpindleMin}`];

        if (active) {
            setIsSpindleOn(false);
            controller.command('gcode', 'M5');
        }

        const commands = [preferredUnits, ...actions.getSpindleOffsetCode(preferredUnits), ...powerCommands, '$32=0', units];

        if (!SLBLaserExists) {
            updateControllerSettings(prevSpindleMax, prevSpindleMin, '0');
        } else {
            dispatch(updatePartialControllerSettings({ $32: '0' }));
        }

        controller.command('gcode', commands);
    };

    // Full enableLaserMode — ported verbatim from desktop (lines 408-458)
    const enableLaserMode = () => {
        const preferredUnits: UNITS_GCODE | UNITS_EN = store.get('workspace.units') === IMPERIAL_UNITS ? 'G20' : 'G21';
        const active = getSpindleActiveState();

        const laser = config.get('laser', { minPower: 0, maxPower: 0 });
        const { minPower, maxPower } = laser;

        const SLBLaserExists = controllerType === GRBLHAL && findIndex(availableSpindles, (o: any) => o.label === 'SLB_LASER') !== -1;

        if (!SLBLaserExists) {
            config.set('spindleMin', spindleMin);
            config.set('spindleMax', spindleMax);
        }

        const powerCommands = SLBLaserExists ? [] : [`$30=${maxPower}`, `$31=${minPower}`];

        if (active) {
            setIsLaserOn(false);
            controller.command('gcode', 'M5');
        }

        const commands = [preferredUnits, ...getLaserOffsetCode(preferredUnits), ...powerCommands, '$32=1', units];

        if (!SLBLaserExists) {
            updateControllerSettings(maxPower, minPower, '1');
        } else {
            dispatch(updatePartialControllerSettings({ $32: '1' }));
        }

        controller.command('gcode', commands);
    };

    const actions = {
        handleModeToggle: () => {
            const newMode = stateRef.current.mode === LASER_MODE ? SPINDLE_MODE : LASER_MODE;
            setState((prev) => ({ ...prev, mode: newMode }));
            if (newMode === SPINDLE_MODE) enableSpindleMode();
            else enableLaserMode();
            pubsub.publish('spindle:mode', newMode);
        },
        sendM3: () => {
            setIsSpindleOn(true);
            controller.command('gcode', `M3 S${stateRef.current.spindleSpeed}`);
        },
        sendM4: () => {
            setIsSpindleOn(true);
            controller.command('gcode', `M4 S${stateRef.current.spindleSpeed}`);
        },
        sendM5: () => {
            setIsLaserOn(false);
            setIsSpindleOn(false);
            controller.command('gcode', 'M5 S0');
        },
        sendLaserM3: () => {
            const power = stateRef.current.laser.maxPower * (stateRef.current.laser.power / 100);
            setIsLaserOn(true);
            controller.command('gcode', `G1F1 M3 S${power}`);
        },
        handleSpindleSpeedChange: (value: number) => {
            if (isSpindleOn) debounceSpindleSpeed(value);
            setState((prev) => ({ ...prev, spindleSpeed: value }));
        },
        handleLaserPowerChange: (value: number) => {
            if (isLaserOn) {
                debounceLaserPower(value, spindle.label === 'SLB_LASER' ? laserMax : state.laser.maxPower);
            }
            setState((prev) => ({ ...prev, laser: { ...prev.laser, power: value } }));
        },
        handleLaserDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = Math.abs(Number(e.target.value) || 0);
            setState((prev) => ({ ...prev, laser: { ...prev.laser, duration: value } }));
        },
        runLaserTest: () => {
            const { power, duration } = state.laser;
            const maxPower = spindle.label === 'SLB_LASER' ? laserMax : state.laser.maxPower;
            controller.command('lasertest:on', power, duration, maxPower);
            setTimeout(() => actions.sendM5(), duration * 1000);
        },
        getSpindleOffsetCode(preferredUnits: UNITS_GCODE | UNITS_EN): string[] {
            const laser = config.get('laser', { maxPower: 0, minPower: 0 });
            setState((prev) => ({ ...prev, laser }));

            let { xOffset, yOffset } = laser;
            if (controllerType === GRBLHAL) { xOffset = laserXOffset; yOffset = laserYOffset; }

            xOffset = Number(xOffset) * -1;
            yOffset = Number(yOffset) * -1;

            if (preferredUnits === 'G20') {
                xOffset = convertToImperial(xOffset);
                yOffset = convertToImperial(yOffset);
            } else {
                xOffset = roundMetric(xOffset);
                yOffset = roundMetric(yOffset);
            }

            const currentWCS = actions.getWCS();
            const [xa, ya] = actions.calculateAdjustedOffsets(xOffset, yOffset, preferredUnits);

            if (xOffset === 0 && yOffset !== 0) return [`G10 L20 P${currentWCS} Y${ya}`];
            if (xOffset !== 0 && yOffset === 0) return [`G10 L20 P${currentWCS} X${xa}`];
            if (xOffset !== 0 && yOffset !== 0) return [`G10 L20 P${currentWCS} X${xa} Y${ya}`];
            return [''];
        },
        calculateAdjustedOffsets(xOffset: number, yOffset: number, u: UNITS_GCODE | UNITS_EN): [number, number] {
            let { x, y } = wpos;
            if ($13 === '1' || u === 'G20') { u = 'G20'; x /= 25.4; y /= 25.4; }
            return [round(Number(x) + Number(xOffset), u), round(Number(y) + Number(yOffset), u)];
        },
        getWCS(): number {
            return ({ G54: 1, G55: 2, G56: 3, G57: 4, G58: 5, G59: 6 } as Record<string, number>)[wcs] || 0;
        },
        handleHALSpindleSelect: (value: string) => {
            const selected = availableSpindles.find((s: any) => String(s.id) === value);
            if (!selected) return;
            pendingSpindleIdRef.current = selected.id;
            dispatch(clearSpindles());
            const spindleCommand = firmwarePastVersion(ATCI_SUPPORTED_VERSION) ? '$spindlesh' : '$spindles';
            controller.command('gcode', [`M104 Q${selected.id}`, spindleCommand]);
        },
    };

    // Derived display state
    const isLaserMode = laserAsSpindle === 1;
    const isActive = spindleModal !== 'M5';
    const spindleForward = spindleModal === 'M3';
    const spindleReverse = spindleModal === 'M4';
    const laserIsOn = spindleModal !== 'M5';
    const clickable = canClick();
    const divider = <div className="mx-4 border-t border-gray-200 dark:border-outline shrink-0" />;

    const { enableDarkMode = false } = useWorkspaceState();
    const isDark = enableDarkMode;

    // Neutral react-select colors come from the Tailwind-backed CSS variables
    // (see index.css) so no neutral hex is hardcoded here. Keyed on isDark so it
    // re-resolves when the theme toggles. The selected-blue stays a brand color.
    const selectTheme = useMemo(
        () => ({
            controlBg: getThemeCssColor('--surface-sunken'),
            controlBorder: getThemeCssColor('--outline-default'),
            controlBorderHover: getThemeCssColor('--outline-strong'),
            menuBg: getThemeCssColor('--surface-elevated'),
            menuBorder: getThemeCssColor('--outline-default'),
            optionFocusedBg: getThemeCssColor('--surface-hover'),
            optionText: getThemeCssColor('--content-secondary'),
            mutedText: getThemeCssColor('--content-muted'),
        }),
        [isDark],
    );

    const enabledSpindles = availableSpindles.filter((s: any) => s.enabled);
    const hasSpindles = enabledSpindles.length > 0;
    const spindleOptions = enabledSpindles.map((s: any) => ({
        label: s.capabilities ? `${s.label} (${s.capabilities})` : s.label,
        value: String(s.id),
    }));
    const selectedOption = spindleOptions.find((o) => o.value === String(spindle.id)) ?? null;

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            minHeight: 32,
            height: 32,
            fontSize: 11,
            fontWeight: 500,
            cursor: !hasSpindles || !clickable ? 'default' : 'pointer',
            backgroundColor: selectTheme.controlBg,
            borderColor: selectTheme.controlBorder,
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': { borderColor: selectTheme.controlBorderHover },
        }),
        valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
        indicatorsContainer: (base: any) => ({ ...base, height: 32 }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: selectTheme.menuBg,
            border: `1px solid ${selectTheme.menuBorder}`,
            borderRadius: 8,
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.55)' : '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 100,
        }),
        option: (base: any, state: any) => ({
            ...base,
            fontSize: 11,
            fontWeight: 500,
            backgroundColor: state.isSelected
                ? isDark ? '#2563eb' : '#3b82f6'
                : state.isFocused
                    ? selectTheme.optionFocusedBg
                    : 'transparent',
            color: state.isSelected ? '#ffffff' : selectTheme.optionText,
            cursor: 'pointer',
        }),
        singleValue: (base: any) => ({
            ...base,
            color: selectTheme.mutedText,
        }),
        placeholder: (base: any) => ({
            ...base,
            color: selectTheme.mutedText,
            fontSize: 11,
        }),
        dropdownIndicator: (base: any) => ({
            ...base,
            color: selectTheme.mutedText,
            padding: '0 6px',
        }),
        indicatorSeparator: () => ({ display: 'none' }),
    };

    return (
        <div className={clsx('h-full flex flex-col min-h-0', mode === 'minimal' && 'justify-center')}>
            {/* Action buttons — always shown */}
            <div className="flex items-center gap-3 px-4 pt-3 pb-2 shrink-0">
                {isLaserMode ? (
                    <>
                        <SpindleButton label="Laser On" Icon={Lightbulb} active={isConnected && laserIsOn} disabled={!clickable} onClick={actions.sendLaserM3} />
                        <SpindleButton label="Test" Icon={Timer} disabled={!clickable} onClick={actions.runLaserTest} />
                        <SpindleButton label="Off" Icon={LightbulbOff} danger disabled={!clickable} onClick={actions.sendM5} />
                    </>
                ) : (
                    <>
                        <SpindleButton label="Forward" Icon={RotateCw} active={isConnected && spindleForward} disabled={!clickable} onClick={actions.sendM3} />
                        <SpindleButton label="Reverse" Icon={RotateCcw} active={isConnected && spindleReverse} disabled={!clickable} onClick={actions.sendM4} />
                        <SpindleButton label="Stop" Icon={Square} danger disabled={!clickable} onClick={actions.sendM5} />
                    </>
                )}
            </div>

            {/* Selector (2/3) + Mode toggle (1/3) — always shown */}
            <div className="flex items-center gap-2 px-4 pb-3 shrink-0">
                <div className={clsx('flex-[2]', (!hasSpindles || !clickable) && 'opacity-40 pointer-events-none')}>
                    <Select
                        options={spindleOptions}
                        value={selectedOption}
                        onChange={(opt) => opt && actions.handleHALSpindleSelect(opt.value)}
                        placeholder="Default Spindle"
                        menuPlacement="top"
                        isDisabled={!hasSpindles || !clickable}
                        styles={selectStyles}
                        isSearchable={false}
                    />
                </div>

                <div className="flex-[1] flex items-center justify-center gap-1">
                    <span className={clsx('text-[10px] font-medium leading-none',
                        !isLaserMode ? 'text-robin-500' : 'text-gray-500 dark:text-content-muted')}>
                        Spindle
                    </span>
                    <button
                        onClick={actions.handleModeToggle}
                        disabled={!clickable}
                        className={clsx(
                            'relative w-9 h-5 rounded-full transition-colors shrink-0',
                            isLaserMode ? 'bg-robin-500' : 'bg-gray-300 dark:bg-dark-lighter',
                            !clickable && 'opacity-40 cursor-default',
                        )}
                    >
                        <span className={clsx(
                            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
                            isLaserMode ? 'left-[18px]' : 'left-0.5',
                        )} />
                    </button>
                    <span className={clsx('text-[10px] font-medium leading-none',
                        isLaserMode ? 'text-robin-500' : 'text-gray-500 dark:text-content-muted')}>
                        Laser
                    </span>
                </div>
            </div>

            {mode === 'expanded' && (
                <>
                    {divider}

                    <div className="flex items-center gap-3 px-4 pt-4 pb-2 shrink-0">
                        <span className="text-xs text-gray-500 dark:text-content-muted w-14 shrink-0">
                            {isLaserMode ? 'Power' : 'Speed'}
                        </span>
                        <Slider
                            value={[isLaserMode ? state.laser.power : state.spindleSpeed]}
                            min={isLaserMode ? 0 : state.spindleMin || 1}
                            max={isLaserMode ? 100 : (state.spindleMax || 30000)}
                            step={isLaserMode ? 1 : 10}
                            disabled={!clickable}
                            onValueChange={([v]: number[]) => isLaserMode
                                ? actions.handleLaserPowerChange(v)
                                : actions.handleSpindleSpeedChange(v)}
                            className="relative flex items-center w-full flex-1 h-7"
                            trackClassName="h-4 bg-gray-400 dark:bg-gray-700 rounded-full relative flex-grow"
                            rangeClassName="absolute h-full rounded-full bg-robin-400"
                            thumbClassName="block w-6 h-6 rounded-xl border-gray-500 border-solid border-2 bg-white outline-none cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                        />
                        <span className="text-xs tabular-nums w-16 text-right shrink-0 text-gray-600 dark:text-content-secondary">
                            {isLaserMode ? `${state.laser.power}%` : `${state.spindleSpeed} RPM`}
                        </span>
                    </div>

                    {isLaserMode && (
                        <div className="flex items-center gap-3 px-4 py-2 shrink-0">
                            <span className="text-xs text-gray-500 dark:text-content-muted w-14 shrink-0">Duration</span>
                            <input
                                type="number"
                                value={state.laser.duration}
                                min={0.1}
                                step={0.1}
                                onChange={actions.handleLaserDurationChange}
                                className="w-20 text-center rounded-lg border border-gray-300 dark:border-outline bg-white dark:bg-dark text-sm text-gray-700 dark:text-content-secondary px-2 py-1.5"
                            />
                            <span className="text-xs text-gray-500 dark:text-content-muted">sec</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
