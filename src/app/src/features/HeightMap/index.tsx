/*
 * Height Map Tool
 * Compensates for uneven stock surfaces by probing and applying Z-offset adjustments
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import {
    Crosshair,
    Cog,
    Upload,
    Download,
    Save,
    FolderOpen,
    Trash2,
    Square,
    AlertTriangle,
    X,
} from 'lucide-react';

import store from 'app/store';
import controller, {
    addControllerEvents,
    removeControllerEvents,
} from 'app/lib/controller';
import {
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    METRIC_UNITS,
    VISUALIZER_SECONDARY,
} from 'app/constants';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { ControlledInput } from 'app/components/ControlledInput';
import { Button } from 'app/components/Button';
import { Switch } from 'app/components/shadcn/Switch';
import InputArea from 'app/components/InputArea';
import Tooltip from 'app/components/Tooltip';
import { convertToImperial, convertToMetric } from 'app/lib/units';
import WidgetConfig from '../WidgetConfig/WidgetConfig';
import defaultState from 'app/store/defaultState';
import { uploadGcodeFileToServer } from 'app/lib/fileupload';

import {
    HeightMapState,
    HeightMapData,
    DEFAULT_HEIGHT_MAP_STATE,
    MIN_VALUES,
} from './definitions';
import GridVisualizer from './components/GridVisualizer';
import ToolpathVisualizer from './components/ToolpathVisualizer';
import { calculateProbeGrid, deriveProbeBounds } from './utils/interpolation';
import {
    createHeightMapFromProbeResults,
    validateHeightMap,
    generateSingleProbeCommand,
    resolveWorkOffsetZ,
    validateProbeTravel,
    describeLegacyNormalizedMap,
    restoreHeightMapSettings,
    calculateProbeTimeoutMs,
    probeConfigToMillimetres,
    validateReportUnits,
} from './utils/probeRoutine';
import {
    beginProbeCycle,
    handleProbeResponse,
    handleProbeTimeout,
    parseProbeResponse,
    ProbeCycleAction,
    ProbeCycleState,
} from './utils/probeCycle';
import { transformGcode } from './utils/gcodeTransformer';

// Default state for height map widget
const defaultHeightMapState = get(
    defaultState,
    'widgets.heightMap',
    DEFAULT_HEIGHT_MAP_STATE,
) as HeightMapState;

/** Pause between points so the machine is at rest before the next probe. */
const PROBE_SETTLE_DELAY_MS = 100;

/**
 * How far the reported probe XY may sit from the commanded grid point.
 *
 * 0.1mm is roughly twenty times the step quantisation of a typical 200
 * step/mm axis and two hundred times the rounding in the probe command, while
 * being ten times smaller than the tightest grid spacing the UI permits (1mm).
 * That gap is the point: comfortably loose for a real machine, far too tight to
 * mistake one grid point for the next.
 */
const PROBE_XY_TOLERANCE_MM = 0.1;


const HeightMapTool: React.FC = () => {
    const navigate = useNavigate();
    const heightMapConfig = new WidgetConfig('heightMap');
    const units = store.get('workspace.units', METRIC_UNITS);
    const isMetric = units === METRIC_UNITS;
    const minValues = isMetric ? MIN_VALUES.metric : MIN_VALUES.imperial;

    /**
     * Millimetres from the controller into whatever the workspace is showing.
     *
     * The counterpart to probeConfigToMillimetres: anything arriving FROM the
     * machine or a parsed file is metric, anything held in state is display
     * units, and every crossing has to say which way it is going.
     */
    const toDisplayUnits = useCallback(
        (mm: number): number => (isMetric ? mm : convertToImperial(mm)),
        [isMetric],
    );

    // Controller status
    const status = useTypedSelector((state) => state?.controller.state?.status);
    const isDisabled =
        status &&
        status.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status.activeState !== GRBL_ACTIVE_STATE_JOG;

    // Get current work position
    const wpos = useTypedSelector((state) => state?.controller.state?.status?.wpos);

    // EEPROM settings, needed for $13 -- see validateReportUnits.
    const eepromSettings = useTypedSelector(
        (state) => state?.controller?.settings?.settings,
    );

    // Get loaded file info
    const fileInfo = useTypedSelector((state) => state?.file);

    // Initialize state
    const getInitialState = (): HeightMapState => {
        const saved = heightMapConfig.get('', defaultHeightMapState);

        if (!isMetric) {
            return {
                ...saved,
                minX: convertToImperial(saved.minX),
                maxX: convertToImperial(saved.maxX),
                minY: convertToImperial(saved.minY),
                maxY: convertToImperial(saved.maxY),
                gridSpacing: convertToImperial(saved.gridSpacing),
                edgeInset: convertToImperial(saved.edgeInset ?? 0),
                zClearance: convertToImperial(saved.zClearance),
                // Per-minute, but still a length. Left out of this list the
                // stored millimetres-per-minute were shown under an in/min
                // label and then sent to the controller unchanged.
                probeFeedRate: convertToImperial(saved.probeFeedRate),
                maxProbeDepth: convertToImperial(saved.maxProbeDepth),
                segmentLength: convertToImperial(saved.segmentLength),
            };
        }
        return saved;
    };

    const [state, setState] = useState<HeightMapState>(getInitialState());
    const [probeStatus, setProbeStatus] = useState<'idle' | 'probing' | 'complete' | 'error'>('idle');
    const [warnings, setWarnings] = useState<string[]>([]);

    // Zero-first reminder dismissal. sessionStorage rather than the persisted
    // store on purpose: dismissing it should hold while the app is open --
    // across navigating away and back -- but return on restart, so a fresh
    // session is always reminded before it probes.
    const ZERO_REMINDER_KEY = 'heightMap.zeroReminderDismissed';
    const [zeroReminderDismissed, setZeroReminderDismissed] = useState<boolean>(
        () => {
            try {
                return sessionStorage.getItem(ZERO_REMINDER_KEY) === 'true';
            } catch {
                return false;
            }
        },
    );
    const dismissZeroReminder = () => {
        try {
            sessionStorage.setItem(ZERO_REMINDER_KEY, 'true');
        } catch {
            // sessionStorage unavailable -- dismiss for this mount at least.
        }
        setZeroReminderDismissed(true);
    };

    // State for tracking height map application and generated G-code
    const [transformedGcode, setTransformedGcode] = useState<string | null>(null);
    const [showDoubleApplyWarning, setShowDoubleApplyWarning] = useState(false);

    // Check if the main visualizer already has a height-map adjusted file
    const mainVisualizerHasHeightMap = fileInfo?.name?.includes('_heightmap') ?? false;

    // Refs for probing
    const probePointsRef = useRef<{ x: number; y: number }[]>([]);
    const probeCycleRef = useRef<ProbeCycleState | null>(null);
    const isAbortedRef = useRef(false);
    // Watchdog for the point currently outstanding, and the short settle delay
    // between points. Both are held so they can be cleared on accept, abort,
    // completion and unmount -- a stray timer here either fires into a finished
    // cycle or keeps the process alive after the widget is gone.
    const probeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Set when a cycle ends with the machine alarmed. The alarm flushes the
    // planner buffer, taking the G90 that follows every G38.2 with it, and grbl
    // rejects g-code while alarmed -- so the restore has to wait for the alarm
    // to clear rather than be sent into the void.
    const pendingModalRestoreRef = useRef(false);
    // Work coordinate offset captured when the cycle starts. Sampled once, not
    // per point, so the whole grid shares one datum -- a WCS switch or G92
    // partway through would otherwise re-datum half the map with nothing to
    // show for it. The cycle stores raw PRB values and they are converted in one
    // place at the end.
    const probeWcoZRef = useRef<number | null>(null);
    // Mirrors the live status without making the probe callbacks depend on it.
    // The controller reports several times a second, and letting that rebuild
    // handleSerialRead would tear down and re-add the serial listener at the
    // same rate -- risking dropping the very PRB response it exists to catch.
    const statusRef = useRef(status);
    useEffect(() => {
        statusRef.current = status;
    }, [status]);
    // Everything the probe callbacks need from render scope, behind one ref.
    // Reading config through this is what lets every probe callback be built
    // once, which in turn lets the serial listener be registered once for the
    // component's lifetime instead of once per point.
    //
    // `mm` is the same configuration in millimetres. Everything the machine or
    // the transformer sees comes from there; `state` is only what the operator
    // is looking at. See probeConfigToMillimetres for why the boundary is here.
    const configRef = useRef({
        state,
        units,
        mm: probeConfigToMillimetres(state, isMetric),
    });
    useEffect(() => {
        configRef.current = {
            state,
            units,
            mm: probeConfigToMillimetres(state, isMetric),
        };
    });

    // Reset transformedGcode when map data changes
    useEffect(() => {
        setTransformedGcode(null);
    }, [state.mapData]);

    // Save state on change
    useEffect(() => {
        const saveState = () => {
            const toSave = isMetric
                ? state
                : {
                      ...state,
                      minX: convertToMetric(state.minX),
                      maxX: convertToMetric(state.maxX),
                      minY: convertToMetric(state.minY),
                      maxY: convertToMetric(state.maxY),
                      gridSpacing: convertToMetric(state.gridSpacing),
                      edgeInset: convertToMetric(state.edgeInset ?? 0),
                      zClearance: convertToMetric(state.zClearance),
                      probeFeedRate: convertToMetric(state.probeFeedRate),
                      maxProbeDepth: convertToMetric(state.maxProbeDepth),
                      segmentLength: convertToMetric(state.segmentLength),
                  };
            heightMapConfig.set('', toSave);
        };

        return saveState();
    }, [state, isMetric]);

    // Update a single field
    const updateField = useCallback((field: keyof HeightMapState, value: any) => {
        setState((prev) => ({ ...prev, [field]: value }));
    }, []);

    // Use current work position for bounds
    const useCurrentWPos = useCallback(
        (field: 'minX' | 'maxX' | 'minY' | 'maxY') => {
            if (!wpos) return;

            const axisMap: Record<string, string> = {
                minX: 'x',
                maxX: 'x',
                minY: 'y',
                maxY: 'y',
            };
            const axis = axisMap[field];
            // wpos is raw controller output, in the controller's own units --
            // millimetres while $13 is 0, which probing requires. State is
            // display units, so this needs the same reconciliation as the file
            // bbox or a millimetre reading lands in an inch-labelled field.
            const value = toDisplayUnits(parseFloat(wpos[axis] || '0'));

            updateField(field, value);
        },
        [wpos, updateField],
    );

    // Grab both X and Y for min values
    const grabCurrentXYForMin = useCallback(() => {
        if (!wpos) return;

        const xValue = toDisplayUnits(parseFloat(wpos.x || '0'));
        const yValue = toDisplayUnits(parseFloat(wpos.y || '0'));

        setState((prev) => ({
            ...prev,
            minX: xValue,
            minY: yValue,
        }));
    }, [wpos]);

    // Reset field to minimum on blur if invalid
    const handleNumericBlur = useCallback(
        (field: keyof HeightMapState, value: number, minValue: number) => {
            if (value <= 0 || isNaN(value)) {
                setState((prev) => ({ ...prev, [field]: minValue }));
            }
        },
        [],
    );

    // Use loaded file bounds, pulled in by the edge inset so probe points stay
    // clear of the edge of the stock.
    const useFileBounds = useCallback(() => {
        if (!fileInfo?.bbox) {
            setWarnings(['No file loaded or file has no bounds']);
            return;
        }

        // The bbox is always millimetres: GCodeVirtualizer runs every position
        // through in2mm when the program is in G20, so the toolpath extents are
        // metric even for an inch program. State is display units, so convert
        // before the inset is applied -- otherwise an imperial workspace ends up
        // holding an inch inset against a millimetre extent in the same field
        // pair, and the probe area is out by 25.4 at one end only.
        const bboxInDisplayUnits = {
            ...fileInfo.bbox,
            min: {
                ...fileInfo.bbox.min,
                x: toDisplayUnits(fileInfo.bbox.min.x),
                y: toDisplayUnits(fileInfo.bbox.min.y),
            },
            max: {
                ...fileInfo.bbox.max,
                x: toDisplayUnits(fileInfo.bbox.max.x),
                y: toDisplayUnits(fileInfo.bbox.max.y),
            },
        };

        const { bounds, applied, rejected } = deriveProbeBounds(
            bboxInDisplayUnits,
            state.edgeInset,
        );

        setState((prev) => ({ ...prev, ...bounds }));

        if (rejected) {
            const { min, max } = fileInfo.bbox;
            setWarnings([
                `An inset of ${state.edgeInset}${units} leaves no probe area for a ` +
                    `${(max.x - min.x).toFixed(1)} x ${(max.y - min.y).toFixed(1)}${units} ` +
                    'toolpath. Bounds were set to the full extents instead.',
            ]);
        } else if (applied > 0) {
            setWarnings([
                `Probe area set ${applied}${units} inside the toolpath extents. ` +
                    'Toolpath outside the probed area is compensated by ' +
                    'extrapolation from the nearest edge points.',
            ]);
        } else {
            setWarnings([]);
        }
    }, [fileInfo, state.edgeInset, units, toDisplayUnits]);

    /** Drop any timer that could fire into a cycle that has moved on. */
    const clearProbeTimers = useCallback(() => {
        if (probeTimeoutRef.current !== null) {
            clearTimeout(probeTimeoutRef.current);
            probeTimeoutRef.current = null;
        }
        if (settleTimeoutRef.current !== null) {
            clearTimeout(settleTimeoutRef.current);
            settleTimeoutRef.current = null;
        }
    }, []);

    /** End the cycle without a map, leaving the operator something to act on. */
    const failProbing = useCallback(
        (message: string) => {
            clearProbeTimers();
            isAbortedRef.current = true;
            probeCycleRef.current = null;
            setProbeStatus('error');
            setState((prev) => ({ ...prev, isProbing: false, lastError: message }));
            setWarnings([message]);

            // Park the tool clear of the work. Skipped when alarmed because grbl
            // rejects g-code in that state; the alarm handler restores modal
            // state once it clears instead.
            // Through gcode:safe, not plain gcode. The clearance is in
            // millimetres, and the device is left in whatever unit modal the
            // last program set -- gcode:safe is itself what restores G20 after
            // an inch job. Unwrapped, `Z5` becomes five inches: error:15 with
            // soft limits on, and the top of the Z column without.
            if (statusRef.current?.activeState !== GRBL_ACTIVE_STATE_ALARM) {
                controller.command(
                    'gcode:safe',
                    `G90 G0 Z${configRef.current.mm.zClearance}`,
                    'G21',
                );
            }
        },
        [clearProbeTimers],
    );

    // Complete probing and create height map
    const completeProbing = useCallback(
        (zValues: number[]) => {
            clearProbeTimers();
            const { mm } = configRef.current;

            setProbeStatus('complete');
            setState((prev) => ({ ...prev, isProbing: false }));

            const wcoZ = probeWcoZRef.current;
            if (wcoZ === null) {
                setProbeStatus('error');
                setWarnings([
                    'Lost the work coordinate offset captured at the start of ' +
                        'probing, so the results cannot be referenced to work zero. ' +
                        'Re-run the probe routine.',
                ]);
                return;
            }

            // A WCS switch or G92 mid-cycle re-datums part of the grid, and there
            // is no way to tell which points landed on which side of it. Say so
            // rather than hand back a map that looks fine and cuts wrong.
            const live = resolveWorkOffsetZ(statusRef.current);
            if (live.ok && Math.abs(live.wcoZ - wcoZ) > 1e-4) {
                setWarnings([
                    `Work Z zero moved during probing (${wcoZ} to ${live.wcoZ}). ` +
                        'Points probed before and after the change use different ' +
                        'datums, so this map is unreliable -- re-probe.',
                ]);
            }

            // Create height map from probe results. The stored PRB values are in
            // machine coordinates; the offset captured at the start of the cycle
            // brings them back to the operator's work Z zero.
            // Stamped 'mm' because that is what it holds: the grid was built
            // from the millimetre configuration and the Z values came from
            // [PRB:] in millimetres. Stamping it with the workspace units would
            // make the transformer rescale readings that were never in inches.
            const mapData = createHeightMapFromProbeResults(
                probePointsRef.current,
                zValues,
                mm,
                'mm',
                wcoZ,
            );

            // Store the probed heights as-is. A probe reading is the surface
            // height in work coordinates, and the transformer adds it straight
            // onto the commanded Z, so the offsets are already referenced to the
            // operator's work Z zero. Re-datuming the map here -- to its own
            // lowest point, or to anything else -- shifts every cut by that
            // amount for the whole job.
            setState((prev) => ({ ...prev, mapData }));
            probeCycleRef.current = null;

            // Retract to clearance height, in millimetres and said so.
            controller.command('gcode:safe', `G90 G0 Z${mm.zClearance}`, 'G21');
        },
        [clearProbeTimers],
    );

    /**
     * Issue the probe for one point and start its watchdog.
     *
     * `settleFirst` covers the short pause between points that lets the machine
     * come to rest; the first point of a cycle does not need it.
     */
    const issueProbe = useCallback(
        (index: number, point: { x: number; y: number }, settleFirst: boolean) => {
            const { mm } = configRef.current;

            const send = () => {
                settleTimeoutRef.current = null;
                if (isAbortedRef.current || probeCycleRef.current === null) return;

                controller.command(
                    'gcode:safe',
                    generateSingleProbeCommand(
                        point.x,
                        point.y,
                        mm.zClearance,
                        mm.probeFeedRate,
                        mm.maxProbeDepth,
                    ),
                    'G21',
                );

                setState((prev) => ({
                    ...prev,
                    currentProbeIndex: index,
                    probeProgress: (index / probePointsRef.current.length) * 100,
                }));

                // Armed only once the command is actually on the wire, so the
                // settle delay is not counted against the machine's response.
                probeTimeoutRef.current = setTimeout(() => {
                    probeTimeoutRef.current = null;
                    const cycle = probeCycleRef.current;
                    if (!cycle) return;
                    const step = handleProbeTimeout(cycle);
                    probeCycleRef.current = step.state;
                    if (step.action.type === 'fail') {
                        failProbing(step.action.message);
                    }
                }, calculateProbeTimeoutMs(mm));
            };

            if (settleFirst) {
                settleTimeoutRef.current = setTimeout(send, PROBE_SETTLE_DELAY_MS);
            } else {
                send();
            }
        },
        [failProbing],
    );

    /** Apply one state machine action to the machine and the UI. */
    const applyProbeAction = useCallback(
        (action: ProbeCycleAction, settleFirst: boolean) => {
            switch (action.type) {
                case 'probe':
                    issueProbe(action.index, action.point, settleFirst);
                    break;
                case 'complete':
                    completeProbing(action.zValues);
                    break;
                case 'fail':
                    failProbing(action.message);
                    break;
                default:
                    // 'ignore' -- a response that was not ours. The watchdog for
                    // the outstanding point deliberately keeps running.
                    break;
            }
        },
        [issueProbe, completeProbing, failProbing],
    );

    // Handle probe response from serial port.
    // Deliberately built once: this is what the serial listener closes over, and
    // rebuilding it would re-register the listener mid-cycle.
    const handleSerialRead = useCallback(
        (data: string) => {
            const cycle = probeCycleRef.current;
            if (!cycle || isAbortedRef.current) return;

            const response = parseProbeResponse(data);
            if (!response) return;

            const step = handleProbeResponse(cycle, response);
            probeCycleRef.current = step.state;

            if (step.action.type !== 'ignore') {
                // The outstanding point answered, so its watchdog has done its
                // job. A response we disowned leaves the timer alone.
                clearProbeTimers();
            }

            applyProbeAction(step.action, true);
        },
        [applyProbeAction, clearProbeTimers],
    );

    // Keep the listener's behaviour current without re-subscribing.
    const handleSerialReadRef = useRef(handleSerialRead);
    useEffect(() => {
        handleSerialReadRef.current = handleSerialRead;
    }, [handleSerialRead]);

    // Set up controller event listeners for probe results.
    // Registered once for the component's lifetime: re-subscribing between
    // points opens a window in which the PRB response is delivered to nobody,
    // which presents as a cycle that hangs for no visible reason.
    useEffect(() => {
        const controllerEvents = {
            'serialport:read': (data: string) => handleSerialReadRef.current(data),
        };

        addControllerEvents(controllerEvents);

        return () => {
            removeControllerEvents(controllerEvents);
        };
    }, []);

    // Stop everything still pending when the widget goes away.
    //
    // Deliberately sends nothing. A modal restore is only ever outstanding
    // because the machine is still alarmed -- if the alarm had cleared, the
    // effect above would already have sent it -- and grbl rejects g-code in the
    // alarm state with error:9. Emitting G90 here would be guaranteed not to
    // land while putting a confusing error on the console and suggesting the
    // machine had been put right. The alarm message carries the instruction
    // instead, since that is what the operator still has after navigating away.
    useEffect(
        () => () => {
            isAbortedRef.current = true;
            probeCycleRef.current = null;
            if (probeTimeoutRef.current !== null) clearTimeout(probeTimeoutRef.current);
            if (settleTimeoutRef.current !== null) clearTimeout(settleTimeoutRef.current);
        },
        [],
    );

    // Watch for the machine alarming.
    //
    // No extra listener: activeState is already on the status this component
    // subscribes to, and an alarm is a state the machine sits in rather than an
    // event that can be missed.
    useEffect(() => {
        const activeState = status?.activeState;

        if (activeState === GRBL_ACTIVE_STATE_ALARM) {
            if (probeCycleRef.current !== null) {
                // The alarm flushed the planner buffer, and the G90 that follows
                // every G38.2 went with it. Nothing can be sent until the alarm
                // clears, so note that the restore is owed.
                pendingModalRestoreRef.current = true;
                // The instruction is spelled out here rather than only deferred,
                // because this message is what survives the operator navigating
                // away. The restore below can only run while this component is
                // mounted, and the Height Map is a route.
                failProbing(
                    'The machine alarmed during probing, so the cycle stopped. ' +
                        'The interrupted probe left the controller in incremental ' +
                        '(G91) mode. Clear the alarm with this tool open and ' +
                        'absolute mode is restored for you; otherwise send G90 ' +
                        'before using MDI or Go To. Check the probe, the stock ' +
                        'position and your soft limits before re-running.',
                );
            }
            return;
        }

        if (pendingModalRestoreRef.current && activeState) {
            pendingModalRestoreRef.current = false;
            // Absolute mode is restored explicitly because a $X unlock keeps the
            // modal state the alarm interrupted -- leaving the operator's next
            // jog or MDI move to be interpreted incrementally.
            // G90 carries no length so the modal cannot misread it today, but
            // it goes through the same wrapper as everything else rather than
            // leaving a second, quieter channel for the next edit to reach for.
            controller.command('gcode:safe', 'G90', 'G21');
        }
    }, [status?.activeState, failProbing]);

    // Start probing routine
    const startProbing = useCallback(() => {
        // Everything from here on is millimetres: the grid, the pre-flight
        // checks, the probe commands and the map. The operator's units only
        // reach the screen.
        const mm = probeConfigToMillimetres(state, isMetric);

        // Calculate probe points
        const points = calculateProbeGrid(
            mm.minX,
            mm.maxX,
            mm.minY,
            mm.maxY,
            mm.gridSpacing,
            mm.usePointCount,
            mm.pointCountX,
            mm.pointCountY,
        );

        if (points.length < 4) {
            setWarnings(['Need at least 4 probe points (2x2 grid minimum)']);
            return;
        }

        // Pre-flight. Each of these makes the cycle impossible to complete
        // correctly, and all are cheaper to catch here than as an alarm, a
        // broken cutter, or a silently wrong map several minutes in.
        const reportUnits = validateReportUnits(eepromSettings);
        if (!reportUnits.valid) {
            setWarnings([reportUnits.error]);
            return;
        }

        const travel = validateProbeTravel(mm.zClearance, mm.maxProbeDepth, 'mm');
        if (!travel.valid) {
            setWarnings([travel.error]);
            return;
        }

        const workOffset = resolveWorkOffsetZ(statusRef.current);
        if (!workOffset.ok) {
            setWarnings([
                `${workOffset.error} Probe results are reported in machine ` +
                    'coordinates and cannot be referenced to your work zero without it.',
            ]);
            return;
        }
        probeWcoZRef.current = workOffset.wcoZ;

        // Reset state
        clearProbeTimers();
        probePointsRef.current = points;
        isAbortedRef.current = false;

        setState((prev) => ({
            ...prev,
            isProbing: true,
            probeProgress: 0,
            totalProbePoints: points.length,
            currentProbeIndex: 0,
            lastError: null,
        }));

        setProbeStatus('probing');
        setWarnings([]);

        // The XY the controller reports is the position it was commanded to, not
        // a measurement, so this only has to absorb step quantisation and the
        // three decimals the command is written with. Keeping it far below the
        // smallest grid spacing the UI allows is what makes it impossible to
        // mistake one grid point for its neighbour.
        //
        // No unit branch: the grid is millimetres and so is WCO, because $13 is
        // 0 -- which the pre-flight above has just confirmed.
        const { wcoZ } = workOffset;
        const step = beginProbeCycle({
            points,
            wco: {
                x: Number(statusRef.current?.wco?.x ?? 0),
                y: Number(statusRef.current?.wco?.y ?? 0),
                z: wcoZ,
            },
            xyTolerance: PROBE_XY_TOLERANCE_MM,
        });
        probeCycleRef.current = step.state;
        applyProbeAction(step.action, false);
    }, [state, isMetric, eepromSettings, clearProbeTimers, applyProbeAction]);

    // Abort probing
    const abortProbing = useCallback(() => {
        clearProbeTimers();
        isAbortedRef.current = true;
        probeCycleRef.current = null;
        controller.command('feedhold');
        controller.command('reset');
        // A soft reset returns grbl to its defaults, which include G90, but the
        // machine may land in alarm on the way. Owe the restore either way; it
        // is a no-op if the reset already did it.
        pendingModalRestoreRef.current = true;

        setProbeStatus('idle');
        setState((prev) => ({
            ...prev,
            isProbing: false,
            lastError: 'Probing aborted by user',
        }));
    }, [clearProbeTimers]);

    // Save height map to file
    const saveMap = useCallback(() => {
        if (!state.mapData) return;

        // Include config values in the saved map
        const dataWithConfig = {
            ...state.mapData,
            config: {
                gridSpacing: state.gridSpacing,
                usePointCount: state.usePointCount,
                zClearance: state.zClearance,
                probeFeedRate: state.probeFeedRate,
                maxProbeDepth: state.maxProbeDepth,
                segmentLength: state.segmentLength,
                // The block above is in display units while the map's points
                // are millimetres, so the two need telling apart on load.
                // Without this the same file restores different settings
                // depending on which unit system happens to be selected.
                units,
            },
        };

        const data = JSON.stringify(dataWithConfig, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `height_map_${new Date().toISOString().slice(0, 10)}.gshmap`;
        a.click();
        URL.revokeObjectURL(url);
    }, [state]);

    // Load height map from file
    const loadMap = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.gshmap,.json,.map';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string) as HeightMapData;
                    const validation = validateHeightMap(data);

                    if (!validation.valid) {
                        setWarnings([`Invalid map file: ${validation.error}`]);
                        return;
                    }

                    // Calculate point counts from resolution or derive from points
                    const pointCountX = data.resolution?.x || [...new Set(data.points.map(p => p.x))].length;
                    const pointCountY = data.resolution?.y || [...new Set(data.points.map(p => p.y))].length;

                    // Bounds follow the points (millimetres); the config block
                    // follows whatever was on screen when it was saved.
                    const restored = restoreHeightMapSettings(data, isMetric);

                    // Update state with map data AND all config values from the loaded map
                    setState((prev) => ({
                        ...prev,
                        mapData: data,
                        // Bounds
                        ...restored.bounds,
                        // Grid resolution
                        gridSpacing: restored.config.gridSpacing ?? prev.gridSpacing,
                        usePointCount:
                            restored.config.usePointCount ?? prev.usePointCount,
                        pointCountX,
                        pointCountY,
                        // Probing safety
                        zClearance: restored.config.zClearance ?? prev.zClearance,
                        probeFeedRate:
                            restored.config.probeFeedRate ?? prev.probeFeedRate,
                        maxProbeDepth:
                            restored.config.maxProbeDepth ?? prev.maxProbeDepth,
                        // Transform settings
                        segmentLength:
                            restored.config.segmentLength ?? prev.segmentLength,
                    }));

                    // Map datum semantics changed, and old files are silently
                    // wrong rather than obviously wrong, so say something.
                    const legacy = describeLegacyNormalizedMap(data);
                    setWarnings(
                        [legacy, restored.warning].filter(Boolean) as string[],
                    );
                } catch (err) {
                    setWarnings(['Failed to parse map file']);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, []);

    // Clear height map.
    //
    // Refuses while a cycle is running. Nulling the cycle here would strand it:
    // no timers cleared, no abort, no retract, the in-flight G38.2 still
    // executing and its response going nowhere, and the UI stuck on "Stop
    // Probing". Stopping the machine is what the adjacent Stop Probing button
    // is for; a button that discards data should not do it by accident. The
    // button is disabled in the same condition, so this guard is belt and
    // braces rather than the primary control.
    const clearMap = useCallback(() => {
        if (probeCycleRef.current !== null) return;

        setState((prev) => ({ ...prev, mapData: null }));
        setProbeStatus('idle');
        setTransformedGcode(null);
    }, []);

    // Generate G-code (apply height map and show in local visualizer)
    const generateGcode = useCallback(async () => {
        if (!state.mapData || !fileInfo?.content) return;

        // Check if the main visualizer already has a height-map adjusted file - show warning
        if (mainVisualizerHasHeightMap) {
            setShowDoubleApplyWarning(true);
            return;
        }

        // Perform the transformation
        const { transformedGcode: gcode, warnings: transformWarnings, errors } = transformGcode(
            fileInfo.content,
            state.mapData,
            {
                // Millimetres, to match the map's own units -- the
                // transformer scales segmentLength by the map's unit stamp.
                segmentLength: probeConfigToMillimetres(state, isMetric)
                    .segmentLength,
                warnOutsideBounds: true,
            },
        );

        if (errors.length > 0) {
            setTransformedGcode('');
            setWarnings(errors);
            return;
        }

        setTransformedGcode(gcode);

        // Upload to secondary visualizer
        const name = `${fileInfo.name?.replace('.gcode', '') || 'gcode'}_heightmap.gcode`;
        const file = new File([gcode], name, { type: 'text/plain' });
        await uploadGcodeFileToServer(file, controller.port, VISUALIZER_SECONDARY);

        setWarnings([`Height map applied. Preview updated.`, ...transformWarnings]);
    }, [state, isMetric, fileInfo, mainVisualizerHasHeightMap]);

    // Confirm double-apply (user wants to proceed anyway)
    const confirmDoubleApply = useCallback(async () => {
        setShowDoubleApplyWarning(false);

        if (!state.mapData || !fileInfo?.content) return;

        // Perform the transformation - this will compound the adjustment since
        // the file already has height map applied
        const { transformedGcode: gcode, errors } = transformGcode(
            fileInfo.content,
            state.mapData,
            {
                // Millimetres, to match the map's own units -- the
                // transformer scales segmentLength by the map's unit stamp.
                segmentLength: probeConfigToMillimetres(state, isMetric)
                    .segmentLength,
                warnOutsideBounds: false,
            },
        );

        if (errors.length > 0) {
            setTransformedGcode('');
            setWarnings(errors);
            return;
        }

        setTransformedGcode(gcode);

        // Upload to secondary visualizer
        const name = `${fileInfo.name?.replace('.gcode', '') || 'gcode'}_heightmap.gcode`;
        const file = new File([gcode], name, { type: 'text/plain' });
        await uploadGcodeFileToServer(file, controller.port, VISUALIZER_SECONDARY);

        setWarnings([`Warning: Height map applied to already-adjusted file. Results may be incorrect.`]);
    }, [state.mapData, state.segmentLength, fileInfo]);

    // Load to main visualizer
    const loadToMainVisualizer = useCallback(async () => {
        if (!transformedGcode) return;

        // Remove any existing _heightmap suffix before adding new one
        const baseName = fileInfo?.name?.replace(/_heightmap/g, '').replace('.gcode', '') || 'gcode';
        const name = `${baseName}_heightmap.gcode`;
        const { size } = new File([transformedGcode], name);

        pubsub.publish('gcode:surfacing', { gcode: transformedGcode, name, size });
        navigate('/');
    }, [transformedGcode, fileInfo, navigate]);

    // Export transformed G-code to file
    const exportTransformedGcode = useCallback(() => {
        let gcodeToExport = transformedGcode;

        if (!gcodeToExport && state.mapData && fileInfo?.content) {
            const result = transformGcode(fileInfo.content, state.mapData, {
                // Millimetres, to match the map's own units -- the
                // transformer scales segmentLength by the map's unit stamp.
                segmentLength: probeConfigToMillimetres(state, isMetric)
                    .segmentLength,
                warnOutsideBounds: false,
            });
            if (result.errors.length > 0) {
                setWarnings(result.errors);
                return;
            }
            gcodeToExport = result.transformedGcode;
        }

        if (!gcodeToExport) return;

        // Create filename based on original
        const originalName = fileInfo?.name?.replace(/\.(gcode|nc|ngc|tap)$/i, '') || 'gcode';
        const exportName = `${originalName}_heightmap.gcode`;

        // Download the file
        const blob = new Blob([gcodeToExport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportName;
        a.click();
        URL.revokeObjectURL(url);

        setWarnings([`Exported transformed G-code to ${exportName}`]);
    }, [transformedGcode, state.mapData, state.segmentLength, fileInfo]);

    // Get map status text
    const getMapStatus = (): string => {
        if (!state.mapData) return 'Empty';

        const { points } = state.mapData;
        const uniqueX = [...new Set(points.map((p) => p.x))].length;
        const uniqueY = [...new Set(points.map((p) => p.y))].length;

        return `Valid (${uniqueX}x${uniqueY}, ${points.length} points)`;
    };

    const inputStyle =
        'text-lg font-light z-0 align-center text-center text-blue-500 pl-1 pr-1 w-full';

    // The paired X/Y range inputs are only ~79px wide -- too narrow to show a
    // 7-character value like -32.498 AND an inline unit suffix without one
    // overlapping the other. The suffix is dropped here and the unit shown once
    // per row instead (see the range rows below); the unit is also present on
    // the Edge Inset and Grid Spacing rows in the same card, so context is not
    // lost.
    const rangeInputStyle =
        'text-lg font-light z-0 text-center text-blue-500 px-1 w-full';

    return (
        <div className="bg-white dark:bg-transparent dark:text-white w-full h-full flex flex-col gap-2">
            {/* Double-Apply Warning Dialog */}
            {showDoubleApplyWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-2 text-yellow-600 dark:text-yellow-400">
                            Warning: File Already Has Height Map Applied
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            The file in the main visualizer already has height map adjustments.
                            Applying again will compound the adjustments and may produce incorrect results.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDoubleApplyWarning(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="!bg-yellow-500 !border-yellow-500"
                                onClick={confirmDoubleApply}
                            >
                                Apply Anyway
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-[minmax(320px,400px)_1fr] gap-4 flex-1 min-h-0">
                {/* Left Panel - Controls */}
                <div className="flex flex-col gap-2 overflow-y-auto pr-2">
                    <p className="text-sm font-normal text-gray-500 dark:text-gray-300">
                        <b>Height Map Tool:</b> Compensate for uneven stock surfaces by
                        probing a grid and applying Z-offset adjustments to your G-code.
                    </p>

                    {/* Zero-first reminder. The map is measured relative to work
                        zero, so the datum must be set on the stock surface before
                        probing -- otherwise the surface is referenced to the wrong
                        origin and every compensated cut is off by that error.
                        Dismissable for the session (see zeroReminderDismissed). */}
                    {!zeroReminderDismissed && (
                        <div className="flex items-start gap-2 rounded border border-amber-400 bg-amber-50 p-2 text-sm text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-300">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <b>Set your work zero first.</b> Zero{' '}
                                <b>Z on the stock surface</b> before probing —
                                ideally zero <b>X, Y and Z</b> so the grid lines up
                                with your program. The height map is measured
                                relative to work zero; probing before it is set (or
                                re-zeroing afterward) references the surface to the
                                wrong origin.
                            </div>
                            <button
                                type="button"
                                onClick={dismissZeroReminder}
                                aria-label="Dismiss reminder"
                                title="Dismiss until restart"
                                className="shrink-0 -mr-0.5 -mt-0.5 rounded p-0.5 text-amber-700 hover:bg-amber-200/60 dark:text-amber-300 dark:hover:bg-amber-500/20"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Grid Bounds */}
                    <div className="border rounded p-2 dark:border-gray-600">
                        <div className="text-sm font-medium mb-1">Grid Bounds</div>
                        <InputArea label="X Range">
                            <div className="grid grid-cols-[1fr_16px_1fr_auto_auto] gap-1 col-span-3 items-center">
                                <ControlledInput
                                    type="number"
                                    className={rangeInputStyle}
                                    value={state.minX}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('minX', Number(e.target.value))
                                    }
                                />
                                <span className="text-center text-sm">-</span>
                                <ControlledInput
                                    type="number"
                                    className={rangeInputStyle}
                                    value={state.maxX}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('maxX', Number(e.target.value))
                                    }
                                />
                                <span className="text-xs text-gray-500 dark:text-white px-0.5">
                                    {units}
                                </span>
                                <Tooltip content="Use current X position for Max">
                                    <button
                                        className="text-xs px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
                                        onClick={() => useCurrentWPos('maxX')}
                                    >
                                        Max
                                    </button>
                                </Tooltip>
                            </div>
                        </InputArea>

                        <InputArea label="Y Range">
                            <div className="grid grid-cols-[1fr_16px_1fr_auto_auto] gap-1 col-span-3 items-center">
                                <ControlledInput
                                    type="number"
                                    className={rangeInputStyle}
                                    value={state.minY}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('minY', Number(e.target.value))
                                    }
                                />
                                <span className="text-center text-sm">-</span>
                                <ControlledInput
                                    type="number"
                                    className={rangeInputStyle}
                                    value={state.maxY}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('maxY', Number(e.target.value))
                                    }
                                />
                                <span className="text-xs text-gray-500 dark:text-white px-0.5">
                                    {units}
                                </span>
                                <Tooltip content="Use current Y position for Max">
                                    <button
                                        className="text-xs px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
                                        onClick={() => useCurrentWPos('maxY')}
                                    >
                                        Max
                                    </button>
                                </Tooltip>
                            </div>
                        </InputArea>

                        <div className="flex items-center justify-end gap-2 mt-2">
                            <Tooltip content="Pull the probe area in from the toolpath extents by this much, so probe points stay clear of the edge of the stock. Applied when using file bounds.">
                                <div className="flex items-center gap-1 mr-auto">
                                    <span className="text-xs whitespace-nowrap">
                                        Edge Inset
                                    </span>
                                    <input
                                        type="number"
                                        className="w-16 text-xs px-1 py-0.5 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        min={minValues.edgeInset}
                                        step="any"
                                        value={state.edgeInset}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            if (!isNaN(val)) {
                                                updateField('edgeInset', val);
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const val = Number(e.target.value);
                                            if (isNaN(val) || val < 0) {
                                                updateField('edgeInset', 0);
                                            }
                                        }}
                                    />
                                    <span className="text-xs">{units}</span>
                                </div>
                            </Tooltip>
                            <Tooltip content="Grab current X/Y position for min values">
                                <button
                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    onClick={grabCurrentXYForMin}
                                >
                                    @ Grab
                                </button>
                            </Tooltip>
                            <Tooltip content={fileInfo?.bbox ? "Set bounds from loaded G-code file" : "No file loaded"}>
                                <button
                                    className={`text-xs px-2 py-1 rounded ${
                                        fileInfo?.bbox
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                    }`}
                                    onClick={useFileBounds}
                                    disabled={!fileInfo?.bbox}
                                >
                                    Use File Bounds
                                </button>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Grid Resolution */}
                    <div className="border rounded p-2 dark:border-gray-600">
                        <div className="text-sm font-medium mb-1">Grid Resolution</div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">Use Point Count</span>
                            <Switch
                                checked={state.usePointCount}
                                onChange={(checked) =>
                                    updateField('usePointCount', checked)
                                }
                            />
                        </div>

                        {state.usePointCount ? (
                            <InputArea label="Points (X x Y)">
                                <div className="grid grid-cols-[1fr_16px_1fr] gap-1 col-span-3">
                                    <ControlledInput
                                        type="number"
                                        min={2}
                                        max={50}
                                        className={inputStyle}
                                        value={state.pointCountX}
                                        immediateOnChange
                                        onChange={(e) =>
                                            updateField(
                                                'pointCountX',
                                                Math.max(2, Number(e.target.value)),
                                            )
                                        }
                                    />
                                    <span className="text-center text-sm">x</span>
                                    <ControlledInput
                                        type="number"
                                        min={2}
                                        max={50}
                                        className={inputStyle}
                                        value={state.pointCountY}
                                        immediateOnChange
                                        onChange={(e) =>
                                            updateField(
                                                'pointCountY',
                                                Math.max(2, Number(e.target.value)),
                                            )
                                        }
                                    />
                                </div>
                            </InputArea>
                        ) : (
                            <InputArea label="Grid Spacing">
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    min={minValues.gridSpacing}
                                    className={inputStyle}
                                    wrapperClassName="col-span-3"
                                    value={state.gridSpacing}
                                    immediateOnChange
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > 0) {
                                            updateField('gridSpacing', val);
                                        }
                                    }}
                                    onBlur={(e) =>
                                        handleNumericBlur('gridSpacing', Number(e.target.value), minValues.gridSpacing)
                                    }
                                />
                            </InputArea>
                        )}
                    </div>

                    {/* Probing Safety */}
                    <div className="border rounded p-2 dark:border-gray-600">
                        <div className="text-sm font-medium mb-1">Probing Safety</div>
                        <InputArea label="Z Clearance">
                            <Tooltip content="Height to retract between probe points">
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    min={minValues.zClearance}
                                    className={inputStyle}
                                    wrapperClassName="col-span-3"
                                    value={state.zClearance}
                                    immediateOnChange
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > 0) {
                                            updateField('zClearance', val);
                                        }
                                    }}
                                    onBlur={(e) =>
                                        handleNumericBlur('zClearance', Number(e.target.value), minValues.zClearance)
                                    }
                                />
                            </Tooltip>
                        </InputArea>

                        <InputArea label="Probe Feed Rate">
                            <Tooltip content="Speed of probe plunge">
                                <ControlledInput
                                    type="number"
                                    suffix={`${units}/min`}
                                    min={minValues.probeFeedRate}
                                    className={inputStyle}
                                    wrapperClassName="col-span-3"
                                    value={state.probeFeedRate}
                                    immediateOnChange
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > 0) {
                                            updateField('probeFeedRate', val);
                                        }
                                    }}
                                    onBlur={(e) =>
                                        handleNumericBlur('probeFeedRate', Number(e.target.value), minValues.probeFeedRate)
                                    }
                                />
                            </Tooltip>
                        </InputArea>

                        <InputArea label="Max Probe Depth">
                            <Tooltip content="Maximum probe travel before alarm">
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    min={minValues.maxProbeDepth}
                                    className={inputStyle}
                                    wrapperClassName="col-span-3"
                                    value={state.maxProbeDepth}
                                    immediateOnChange
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val > 0) {
                                            updateField('maxProbeDepth', val);
                                        }
                                    }}
                                    onBlur={(e) =>
                                        handleNumericBlur('maxProbeDepth', Number(e.target.value), minValues.maxProbeDepth)
                                    }
                                />
                            </Tooltip>
                        </InputArea>
                    </div>

                    {/* Segment Length */}
                    <InputArea label="Segment Length">
                        <Tooltip content="Max line length before subdivision (smaller = more accurate)">
                            <ControlledInput
                                type="number"
                                suffix={units}
                                min={minValues.segmentLength}
                                className={inputStyle}
                                wrapperClassName="col-span-3"
                                value={state.segmentLength}
                                immediateOnChange
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (val > 0) {
                                        updateField('segmentLength', val);
                                    }
                                }}
                                onBlur={(e) =>
                                    handleNumericBlur('segmentLength', Number(e.target.value), minValues.segmentLength)
                                }
                            />
                        </Tooltip>
                    </InputArea>

                    {/* Grid Preview */}
                    <div className="border rounded p-2 dark:border-gray-600">
                        <div className="text-sm font-medium mb-1">Grid Preview</div>
                        <GridVisualizer
                            minX={state.minX}
                            maxX={state.maxX}
                            minY={state.minY}
                            maxY={state.maxY}
                            gridSpacing={state.gridSpacing}
                            usePointCount={state.usePointCount}
                            pointCountX={state.pointCountX}
                            pointCountY={state.pointCountY}
                            mapData={state.mapData}
                            currentProbeIndex={state.currentProbeIndex}
                            isProbing={state.isProbing}
                        />
                    </div>

                    {/* Map Status */}
                    <div className="border rounded p-2 dark:border-gray-600">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Map Status:</span>
                            <span
                                className={`text-sm ${
                                    state.mapData
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-500'
                                }`}
                            >
                                {getMapStatus()}
                            </span>
                        </div>

                        {/* Progress bar during probing */}
                        {state.isProbing && (
                            <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Probing...</span>
                                    <span>
                                        {state.currentProbeIndex} / {state.totalProbePoints}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded transition-all"
                                        style={{ width: `${state.probeProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Status indicators */}
                        {mainVisualizerHasHeightMap && (
                            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                                Main visualizer has height-map adjusted file
                            </div>
                        )}

                        {/* Map Management Buttons - belong to Map Status */}
                        <div className="flex gap-2 flex-wrap mt-2">
                            <Tooltip content="Save the current height map to a file">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={saveMap}
                                    disabled={!state.mapData}
                                    icon={<Save className="w-4 h-4" />}
                                    text="Save Map"
                                />
                            </Tooltip>
                            <Tooltip content="Load a previously saved height map">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={loadMap}
                                    icon={<FolderOpen className="w-4 h-4" />}
                                    text="Load Map"
                                />
                            </Tooltip>
                            <Tooltip content="Clear the current height map data">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={clearMap}
                                    disabled={!state.mapData || state.isProbing}
                                    icon={<Trash2 className="w-4 h-4" />}
                                    text="Clear Map"
                                />
                            </Tooltip>
                        </div>
                    </div>

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
                            {warnings.map((w, i) => (
                                <div key={i}>{w}</div>
                            ))}
                        </div>
                    )}

                    {/* Status indicator for generated G-code */}
                    {transformedGcode && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                            G-code generated with height map (preview ready)
                        </div>
                    )}

                    {/* Operation Buttons - belong to entire screen */}
                    <div className="flex gap-2 flex-wrap">
                        {state.isProbing ? (
                            <Tooltip content="Stop the current probing routine">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    className="!bg-red-500 !border-red-500"
                                    onClick={abortProbing}
                                    icon={<Square className="w-4 h-4" />}
                                    text="Stop Probing"
                                />
                            </Tooltip>
                        ) : (
                            <Tooltip content="Start probing routine to measure surface heights at grid points">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={startProbing}
                                    disabled={isDisabled}
                                    icon={<Crosshair className="w-4 h-4" />}
                                    text="Run Probe Routine"
                                />
                            </Tooltip>
                        )}

                        <Tooltip content="Apply height map adjustments to the loaded G-code and preview">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={generateGcode}
                                disabled={!state.mapData || !fileInfo?.content}
                                icon={<Cog className="w-4 h-4" />}
                                text="Generate G-code"
                            />
                        </Tooltip>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Tooltip content="Load the height-map adjusted G-code to the main visualizer for running">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={loadToMainVisualizer}
                                disabled={!transformedGcode}
                                icon={<Upload className="w-4 h-4" />}
                                text="Load to Main Visualizer"
                            />
                        </Tooltip>

                        <Tooltip content="Download the height-map adjusted G-code as a file">
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={exportTransformedGcode}
                                disabled={!state.mapData || !fileInfo?.content}
                                icon={<Download className="w-4 h-4" />}
                                text="Export G-code"
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* Right Panel - 3D Visualizer */}
                <div className="flex flex-col border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden min-h-[400px]">
                    <div className="text-sm font-medium p-2 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                        Modified Toolpath Preview
                    </div>
                    <div className="flex-1">
                        <ToolpathVisualizer gcode={transformedGcode} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeightMapTool;
