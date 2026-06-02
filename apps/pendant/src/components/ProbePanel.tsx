import { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { Play } from 'lucide-react';
import includes from 'lodash/includes';
import get from 'lodash/get';

import { useTypedSelector } from '@gsender/controller-client/hooks/useTypedSelector';
import type { RootState } from '@gsender/controller-client/store/redux';
import controller from '@gsender/controller-client/controller';

import store from 'app/store';
import WidgetConfig from 'app/features/WidgetConfig/WidgetConfig';
import { convertToImperial } from 'app/lib/units';
import { getProbeCode } from 'app/lib/Probing';
import {
    TOUCHPLATE_TYPE_AUTOZERO,
    TOUCHPLATE_TYPE_BITZERO,
    TOUCHPLATE_TYPE_ZERO,
    TOUCHPLATE_TYPE_3D,
    PROBE_TYPE_AUTO,
    PROBE_TYPE_DIAMETER,
    TOUCHPLATE_TYPES,
} from 'app/lib/constants';
import {
    GRBL, GRBLHAL, GRBL_ACTIVE_STATE_IDLE, METRIC_UNITS,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { UNITS_EN } from 'app/definitions/general';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@gsender/ui/shadcn/Dropdown';
import { Button } from '@gsender/ui/primitives/Button';

import RunProbe from '@gsender/features/Probe/RunProbe';
import ProbeConnectivityBadge from './ProbeConnectivityBadge';
import ProbeImage from '@gsender/features/Probe/ProbeImage';
import ProbeDirectionSelection from '@gsender/features/Probe/ProbeDirectionSelection';
import ProbeDiameter from '@gsender/features/Probe/ProbeDiameter';
import {
    Actions, AvailableTool, PROBE_TYPES_T, ProbeCommand,
    ProbeProfile, ProbingOptions, State, TOUCHPLATE_TYPES_T,
} from '@gsender/features/Probe/definitions';

type DrawerMode = 'closed' | 'minimal' | 'expanded';
interface Props { mode: DrawerMode }

export default function ProbePanel({ mode }: Props) {
    const config = new WidgetConfig('probe');

    const {
        probePinStatus, distance, type, workflow, isConnected, $13, $22, activeState,
    } = useTypedSelector((s: RootState) => ({
        distance:       s.controller.state.parserstate?.modal.distance,
        probePinStatus: s.controller.state.status?.pinState.P ?? false,
        type:           s.controller.type,
        workflow:       s.controller.workflow,
        isConnected:    s.connection.isConnected,
        $13:            s.controller.settings.settings.$13 ?? '0',
        $22:            s.controller.settings.settings.$22 ?? '0',
        activeState:    s.controller.state.status?.activeState,
        mpos:           s.controller.mpos,
        zMaxTravel:     s.controller.settings.settings.$132 ?? '170',
    }));

    const defaultTool: AvailableTool = { metricDiameter: 6.35, imperialDiameter: 0.25, type: '' };

    const [touchplateType, setTouchplateType] = useState<TOUCHPLATE_TYPES_T>(
        store.get('workspace.probeProfile.touchplateType'),
    );
    const [units, setUnits] = useState<UNITS_EN>(store.get('workspace.units'));
    const [testInterval, setTestInterval] = useState<NodeJS.Timeout>(null);
    const [availableTools, setAvailableTools] = useState<AvailableTool[]>(
        store.get('workspace.tools', []),
    );
    const [currentTool, setCurrentTool] = useState<AvailableTool>(
        availableTools ? availableTools[0] : defaultTool,
    );
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [probeCommand, setProbeCommand] = useState<string>(config.get('probeCommand', 'G38.2'));
    const [useTLO, setUseTLO] = useState<boolean>(config.get('useTLO'));
    const [probeDepth, setProbeDepth] = useState<number>(config.get('probeDepth') || {});
    const [probeFeedrate, setProbeFeedrate] = useState<number>(config.get('probeFeedrate') || {});
    const [probeFastFeedrate, setProbeFastFeedrate] = useState<number>(config.get('probeFastFeedrate') || {});
    const [touchPlateHeight, setTouchPlateHeight] = useState<number>(config.get('touchPlateHeight') || {});
    const [retractionDistance, setRetractionDistance] = useState<number>(config.get('retractionDistance') || {});
    const [zRetractDistance, setZRetractDistance] = useState<number>(config.get('zRetractNormal') || {});
    const [zRetractDistanceAuto, setZRetractDistanceAuto] = useState<number>(config.get('zRetractAuto') || {});
    const [zProbeDistance, setZProbeDistance] = useState<number>(config.get('zProbeDistance') || {});
    const [tipDiameter3D, setTipDiameter3D] = useState<number>(config.get('tipDiameter3D') || 2);
    const [xyRetract3D, setXYRetract3D] = useState<number>(config.get('xyRetract3D') || {});
    const [touchplate, setTouchplate] = useState<ProbeProfile>(store.get('workspace.probeProfile', {}));
    const [useSafeProbeOption, setUseSafeProbeOption] = useState<boolean>(false);
    const [selectedProbeCommand, setSelectedProbeCommand] = useState<number>(0);
    const [touchplateTypeSwitcher, setTouchplateTypeSwitcher] = useState<boolean>(
        config.get('touchplateTypeSwitcher'),
    );
    const [connectivityTest, setConnectivityTest] = useState<boolean>(config.get('connectivityTest'));
    const [connectionMade, setConnectionMade] = useState<boolean>(false);
    const [direction, setDirection] = useState<number>(config.get('direction', 0));
    const connectionMadeRef = useRef<boolean>(false);

    const calcProbeType = (): PROBE_TYPES_T =>
        touchplateType === TOUCHPLATE_TYPE_AUTOZERO ? PROBE_TYPE_AUTO : PROBE_TYPE_DIAMETER;

    const [probeType, setProbeType] = useState<PROBE_TYPES_T>(calcProbeType());

    const calcToolDiameter = (newU?: UNITS_EN, newPT?: PROBE_TYPES_T): number => {
        const newProbeType = newPT || probeType;
        const newUnits = newU || units;
        if (newProbeType === PROBE_TYPE_AUTO || newProbeType === 'Tip') return 0.0;
        if (!currentTool) return newUnits === METRIC_UNITS ? 6.35 : 0.25;
        return currentTool[newUnits === METRIC_UNITS ? 'metricDiameter' : 'imperialDiameter'];
    };

    const [toolDiameter, setToolDiameter] = useState<number>(() => calcToolDiameter());

    const PROBE_DISTANCE_METRIC = { x: 30, y: 30, z: zProbeDistance ? zProbeDistance : 30 };
    const PROBE_DISTANCE_IMPERIAL = { x: 1.2, y: 1.2, z: zProbeDistance ? convertToImperial(zProbeDistance) : 1.2 };

    const actions: Actions = {
        startConnectivityTest: (): void => {
            const { returnProbeConnectivity } = actions;
            if (testInterval) { clearInterval(testInterval); setTestInterval(null); }
            if (!connectivityTest) { setConnectionMade(true); return; }
            setTestInterval(setInterval(() => {
                if (returnProbeConnectivity()) {
                    setConnectionMade(true);
                    clearInterval(testInterval);
                    setTestInterval(null);
                }
            }, 250));
        },
        setProbeConnectivity: (cm: boolean): void => { setConnectionMade(cm); },
        onOpenChange: (isOpen: boolean): void => {
            if (isOpen) {
                setConnectionMade(false);
                actions.startConnectivityTest();
            } else {
                if (testInterval) clearInterval(testInterval);
                setTestInterval(null);
                setConnectionMade(false);
            }
            setModalIsOpen(isOpen);
        },
        changeProbeCommand: (value: string): void => { setProbeCommand(value); },
        changeTouchPlateType: (value: TOUCHPLATE_TYPES_T): void => {
            store.set('workspace.probeProfile.touchplateType', value);
        },
        toggleUseTLO: (): void => { setUseTLO(!useTLO); },
        handleProbeDepthChange: (event: Event): void => {
            setProbeDepth(Number((event.target as HTMLTextAreaElement).value));
        },
        handleProbeFeedrateChange: (event: Event): void => {
            setProbeFeedrate(Number((event.target as HTMLTextAreaElement).value));
        },
        handleRetractionDistanceChange: (event: Event): void => {
            setRetractionDistance(Number((event.target as HTMLTextAreaElement).value));
        },
        handleZRetractDistanceChange: (event: Event): void => {
            setZRetractDistance(Number((event.target as HTMLTextAreaElement).value));
        },
        handleZRetractDistanceAutoChange: (event: Event): void => {
            setZRetractDistanceAuto(Number((event.target as HTMLTextAreaElement).value));
        },
        handleProbeCommandChange: (index: number): void => {
            setUseSafeProbeOption(false);
            setSelectedProbeCommand(index);
        },
        handleSafeProbeToggle: (): void => { setUseSafeProbeOption(!useSafeProbeOption); },
        generatePossibleProbeCommands: (): ProbeCommand[] => {
            const commands: ProbeCommand[] = [];
            const selectedProfile = touchplate;
            const is3D = selectedProfile.touchplateType === TOUCHPLATE_TYPE_3D;
            const functions = { z: true, y: selectedProfile.touchplateType !== TOUCHPLATE_TYPE_ZERO, x: selectedProfile.touchplateType !== TOUCHPLATE_TYPE_ZERO };

            if (functions.z) {
                commands.push({ id: 'Z Touch', safe: false, tool: false, axes: { x: false, y: false, z: true } });
            }
            if (functions.x && functions.y) {
                if (functions.z) {
                    commands.push({ id: 'XYZ Touch', safe: true, tool: !is3D, axes: { x: true, y: true, z: true } });
                }
                commands.push({ id: 'XY Touch', safe: true, tool: !is3D, axes: { x: true, y: true, z: false } });
                commands.push({ id: 'X Touch', safe: true, tool: !is3D, axes: { x: true, y: false, z: false } });
                commands.push({ id: 'Y Touch', safe: true, tool: !is3D, axes: { x: false, y: true, z: false } });
            }
            return commands;
        },
        generateProbeCommands: (): string[] => generateProbeCommands(),
        runProbeCommands: (commands: string[]): void => {
            controller.command('gcode:safe', commands, 'G21');
        },
        returnProbeConnectivity: (): boolean => probePinStatus,
        _setToolDiameter: (selection: { value: number }): void => {
            setToolDiameter(Number(selection?.value) || 0.0);
        },
        _setProbeType: (value: PROBE_TYPES_T): void => { setProbeType(value); },
        _setCurrentTool: (tool: AvailableTool): void => { setCurrentTool(tool); },
        nextProbeDirection: (): void => { setDirection(d => d >= 3 ? 0 : d + 1); },
    };

    const generateProbeCommands = (): string[] => {
        const probeCmd = availableProbeCommands[selectedProbeCommand];
        const { axes } = probeCmd;
        const probeDistances = units === METRIC_UNITS ? PROBE_DISTANCE_METRIC : PROBE_DISTANCE_IMPERIAL;
        const modal = units === METRIC_UNITS ? '21' : '20';

        let zThickness, xyThickness, feedrate, fastFeedrate, retractDist, zRetractNorm, tipDiam, xyRetract;

        if (units === METRIC_UNITS) {
            zThickness = touchplate.zThickness;
            xyThickness = touchplate.xyThickness;
            feedrate = probeFeedrate;
            fastFeedrate = probeFastFeedrate;
            retractDist = retractionDistance;
            zRetractNorm = zRetractDistance;
            tipDiam = tipDiameter3D;
            xyRetract = xyRetract3D;
        } else {
            zThickness = {
                autoZero: touchplate.zThickness.autoZero,
                standardBlock: convertToImperial(touchplate.zThickness.standardBlock),
                zProbe: convertToImperial(touchplate.zThickness.zProbe),
                probe3D: convertToImperial(touchplate.zThickness.probe3D),
                bitZero: convertToImperial(touchplate.zThickness.bitZero ?? 0),
                bitZeroZOnly: convertToImperial(touchplate.zThickness.bitZeroZOnly ?? 0),
            };
            xyThickness = convertToImperial(touchplate.xyThickness);
            feedrate = convertToImperial(probeFeedrate);
            fastFeedrate = convertToImperial(probeFastFeedrate);
            retractDist = convertToImperial(retractionDistance);
            zRetractNorm = convertToImperial(zRetractDistance);
            tipDiam = convertToImperial(tipDiameter3D);
            xyRetract = convertToImperial(xyRetract3D);
        }

        const options: ProbingOptions = {
            axes, modal, probeFast: fastFeedrate, probeSlow: feedrate,
            units, retract: retractDist, zRetractNormal: zRetractNorm,
            zRetractAuto: zRetractDistanceAuto, toolDiameter, zThickness,
            xyThickness, plateType: touchplate.touchplateType, $13,
            probeDistances, probeType, homingEnabled: $22 !== '0',
            tipDiameter3D: tipDiam, xyRetract3D: xyRetract, firmware: type,
        };

        const code = getProbeCode(options, direction);
        code.push(distance);
        return code;
    };

    const canClick = (): boolean => {
        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (!includes([GRBL, GRBLHAL], type)) return false;
        return includes([GRBL_ACTIVE_STATE_IDLE], activeState);
    };

    const onStoreChange = useCallback((data: { workspace: any }) => {
        if (!data) return;
        const { workspace } = data;
        const probeProfile: ProbeProfile = get(workspace, 'probeProfile', null);
        const newUnits = get(workspace, 'units');

        if (probeProfile?.touchplateType === TOUCHPLATE_TYPE_ZERO) {
            actions.handleProbeCommandChange(0);
        }
        if (probeProfile && touchplateType !== probeProfile.touchplateType
            && touchplateType === TOUCHPLATE_TYPE_AUTOZERO && toolDiameter === 0) {
            setProbeType(PROBE_TYPE_DIAMETER);
            setCurrentTool(defaultTool);
            setToolDiameter(calcToolDiameter(newUnits, PROBE_TYPE_DIAMETER));
        } else {
            setToolDiameter(calcToolDiameter(newUnits));
        }

        setUnits(store.get('workspace.units'));
        setAvailableTools(store.get('workspace.tools', []));
        setTouchplateType(store.get('workspace.probeProfile.touchplateType'));
        setTouchplate(store.get('workspace.probeProfile', {}));
        setTouchplateTypeSwitcher(config.get('touchplateTypeSwitcher'));
        setProbeCommand(config.get('probeCommand', 'G38.2'));
        setUseTLO(config.get('useTLO'));
        setProbeDepth(config.get('probeDepth') || {});
        setProbeFeedrate(config.get('probeFeedrate') || {});
        setProbeFastFeedrate(config.get('probeFastFeedrate') || {});
        setTouchPlateHeight(config.get('touchPlateHeight') || {});
        setRetractionDistance(config.get('retractionDistance') || {});
        setZProbeDistance(config.get('zProbeDistance') || {});
        setTipDiameter3D(config.get('tipDiameter3D', 0));
        setXYRetract3D(config.get('xyRetract3D', 10));
        setConnectivityTest(config.get('connectivityTest'));
        setZRetractDistance(config.get('zRetractNormal'));
        setZRetractDistanceAuto(config.get('zRetractAuto'));

        const newZProbeDistance = config.get('zProbeDistance');
        if (newZProbeDistance) {
            PROBE_DISTANCE_METRIC.z = newZProbeDistance;
            PROBE_DISTANCE_IMPERIAL.z = convertToImperial(newZProbeDistance);
        }
    }, [touchplateType, units, toolDiameter, probeType]);

    useEffect(() => {
        store.on('change', onStoreChange);
        return () => { store.removeListener('change', onStoreChange); };
    }, [touchplateType, units, toolDiameter, probeType]);

    useEffect(() => {
        config.set('probeCommand', probeCommand);
        config.set('useTLO', useTLO);
        config.set('probeDepth', probeDepth);
        config.set('touchPlateHeight', touchPlateHeight);
        config.set('direction', direction);
    });

    useEffect(() => { connectionMadeRef.current = connectionMade; }, [connectionMade]);

    const availableProbeCommands = actions.generatePossibleProbeCommands();
    const probeCmd = availableProbeCommands[selectedProbeCommand] ?? availableProbeCommands[0];

    const state: State = {
        show: modalIsOpen,
        connectionMade,
        connectionMadeRef,
        canClick: canClick(),
        availableProbeCommands,
        selectedProbeCommand,
        touchplate,
        touchplateTypeSwitcher,
        toolDiameter,
        availableTools,
        units,
        direction,
        probeType,
        connectivityTest,
    };

    const isZProbeOnly = touchplate.touchplateType === TOUCHPLATE_TYPE_ZERO;
    const showRow2 = probeCmd?.tool || !isZProbeOnly;

    return (
        <div className="h-full flex flex-col px-3 py-2 gap-2 min-h-0">
            {/* Control rows: flex-1 left section + fixed-width right column */}
            <div className="flex gap-2 shrink-0">
                {/* Left section */}
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                    {/* Routine selector */}
                    <div className="flex bg-white dark:bg-dark rounded-lg border border-gray-300 dark:border-gray-700 p-0.5">
                        {availableProbeCommands.map((cmd, i) => (
                            <button
                                key={cmd.id}
                                type="button"
                                onClick={() => actions.handleProbeCommandChange(i)}
                                className={clsx(
                                    'flex-1 text-xs font-semibold py-2.5 rounded-md transition-colors',
                                    i === selectedProbeCommand
                                        ? 'bg-blue-400/30 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-lighter',
                                )}
                            >
                                {cmd.id.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                    {/* Width selector — only when routine requires it */}
                    {showRow2 && probeCmd?.tool && (
                        <ProbeDiameter actions={actions} state={state} probeCommand={probeCmd} />
                    )}
                </div>

                {/* Fixed-width right column — Probe button + Corner selector stacked */}
                <div className="shrink-0 flex flex-col gap-2 w-24">
                    <button
                        type="button"
                        onClick={() => actions.onOpenChange(true)}
                        disabled={!canClick()}
                        className={clsx(
                            'w-full flex items-center justify-center gap-1.5 rounded-xl',
                            'font-semibold text-sm min-h-[44px]',
                            'bg-blue-500 hover:bg-blue-600 text-white',
                            'disabled:opacity-40 disabled:cursor-default transition-colors',
                        )}
                    >
                        <Play size={13} fill="white" className="text-white" />
                        Probe
                    </button>
                    {showRow2 && !isZProbeOnly && (
                        <ProbeDirectionSelection
                            direction={direction}
                            onClick={actions.nextProbeDirection}
                            isAbsolute={false}
                            containerClassName="flex items-center justify-center min-h-[44px]"
                        />
                    )}
                </div>
            </div>

            {/* Expanded: Probe Block dropdown + Image card */}
            {mode === 'expanded' && (
                <>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">Probe Block</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" className="flex-1 justify-between bg-white dark:bg-gray-800">
                                    {touchplate.touchplateType ?? 'Standard Block'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white dark:bg-dark-darker">
                                {Object.values(TOUCHPLATE_TYPES).map((tpt) => (
                                    <DropdownMenuItem
                                        key={tpt}
                                        onClick={() => actions.changeTouchPlateType(tpt as TOUCHPLATE_TYPES_T)}
                                        className="cursor-pointer hover:bg-blue-100 dark:hover:bg-dark-lighter transition-colors"
                                    >
                                        {tpt}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Image card — connectivity badge replaces the corner overlay */}
                    <div className="flex-1 relative rounded-xl border border-robin-200 dark:border-dark-lighter bg-white dark:bg-dark overflow-hidden flex items-center justify-center min-h-0 [&_img]:!w-auto [&_img]:!max-w-[85%] [&_img]:!max-h-[85%]">
                        <ProbeImage
                            probeCommand={probeCmd}
                            touchplateType={touchplate.touchplateType}
                        />
                        <ProbeConnectivityBadge
                            isConnected={isConnected}
                            probeActive={probePinStatus}
                            className="absolute top-2 right-2"
                        />
                    </div>
                </>
            )}

            {/* RunProbe modal — always mounted, shows when state.show === true */}
            <RunProbe state={state} actions={actions} />
        </div>
    );
}
