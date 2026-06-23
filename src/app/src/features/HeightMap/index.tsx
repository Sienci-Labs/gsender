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
} from 'lucide-react';

import store from 'app/store';
import controller, {
    addControllerEvents,
    removeControllerEvents,
} from 'app/lib/controller';
import {
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
} from './definitions';
import GridVisualizer from './components/GridVisualizer';
import ToolpathVisualizer from './components/ToolpathVisualizer';
import { calculateProbeGrid } from './utils/interpolation';
import {
    createHeightMapFromProbeResults,
    normalizeHeightMap,
    validateHeightMap,
    generateSingleProbeCommand,
} from './utils/probeRoutine';
import { transformGcode } from './utils/gcodeTransformer';

// Default state for height map widget
const defaultHeightMapState = get(
    defaultState,
    'widgets.heightMap',
    DEFAULT_HEIGHT_MAP_STATE,
) as HeightMapState;

// Minimum values based on units
const MIN_VALUES = {
    metric: {
        gridSpacing: 1,
        zClearance: 1,
        probeFeedRate: 25,
        maxProbeDepth: 0.1,
        segmentLength: 0.01,
    },
    imperial: {
        gridSpacing: 0.04,
        zClearance: 0.04,
        probeFeedRate: 1,
        maxProbeDepth: 0.004,
        segmentLength: 0.004,
    },
};

const HeightMapTool: React.FC = () => {
    const navigate = useNavigate();
    const heightMapConfig = new WidgetConfig('heightMap');
    const units = store.get('workspace.units', METRIC_UNITS);
    const isMetric = units === METRIC_UNITS;
    const minValues = isMetric ? MIN_VALUES.metric : MIN_VALUES.imperial;

    // Controller status
    const status = useTypedSelector((state) => state?.controller.state?.status);
    const isDisabled =
        status &&
        status.activeState !== GRBL_ACTIVE_STATE_IDLE &&
        status.activeState !== GRBL_ACTIVE_STATE_JOG;

    // Get current work position
    const wpos = useTypedSelector((state) => state?.controller.state?.status?.wpos);

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
                zClearance: convertToImperial(saved.zClearance),
                maxProbeDepth: convertToImperial(saved.maxProbeDepth),
                segmentLength: convertToImperial(saved.segmentLength),
            };
        }
        return saved;
    };

    const [state, setState] = useState<HeightMapState>(getInitialState());
    const [probeStatus, setProbeStatus] = useState<'idle' | 'probing' | 'complete' | 'error'>('idle');
    const [warnings, setWarnings] = useState<string[]>([]);

    // State for tracking height map application and generated G-code
    const [transformedGcode, setTransformedGcode] = useState<string | null>(null);
    const [showDoubleApplyWarning, setShowDoubleApplyWarning] = useState(false);

    // Check if the main visualizer already has a height-map adjusted file
    const mainVisualizerHasHeightMap = fileInfo?.name?.includes('_heightmap') ?? false;

    // Refs for probing
    const probePointsRef = useRef<{ x: number; y: number }[]>([]);
    const probeZValuesRef = useRef<number[]>([]);
    const currentProbeIndexRef = useRef(0);
    const isAbortedRef = useRef(false);

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
                      zClearance: convertToMetric(state.zClearance),
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
            const value = parseFloat(wpos[axis] || '0');

            updateField(field, value);
        },
        [wpos, updateField],
    );

    // Grab both X and Y for min values
    const grabCurrentXYForMin = useCallback(() => {
        if (!wpos) return;

        const xValue = parseFloat(wpos.x || '0');
        const yValue = parseFloat(wpos.y || '0');

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

    // Use loaded file bounds
    const useFileBounds = useCallback(() => {
        if (!fileInfo?.bbox) {
            setWarnings(['No file loaded or file has no bounds']);
            return;
        }

        const { min, max } = fileInfo.bbox;
        setState((prev) => ({
            ...prev,
            minX: min.x,
            maxX: max.x,
            minY: min.y,
            maxY: max.y,
        }));
        setWarnings([]);
    }, [fileInfo]);

    // Complete probing and create height map
    // Note: Defined before handleSerialRead since it's used as a dependency
    const completeProbing = useCallback(() => {
        setProbeStatus('complete');
        setState((prev) => ({ ...prev, isProbing: false }));

        // Create height map from probe results
        const mapData = createHeightMapFromProbeResults(
            probePointsRef.current,
            probeZValuesRef.current,
            state,
            units,
        );

        // Normalize (make lowest point Z=0)
        const normalizedMap = normalizeHeightMap(mapData);

        setState((prev) => ({ ...prev, mapData: normalizedMap }));

        // Retract to clearance height
        controller.command('gcode', `G90 G0 Z${state.zClearance}`);
    }, [state, units]);

    // Handle probe response from serial port
    // PRB response format: [PRB:x.xxx,y.yyy,z.zzz:1] where :1 means probe succeeded
    const handleSerialRead = useCallback(
        (data: string) => {
            // Only process if we're actively probing
            if (!state.isProbing || isAbortedRef.current) return;

            // Check for PRB response: [PRB:x.xxx,y.yyy,z.zzz:result]
            const prbMatch = data.match(/\[PRB:([^,]+),([^,]+),([^:]+):(\d)\]/);
            if (!prbMatch) return;

            const zValue = parseFloat(prbMatch[3]);
            const probeSuccess = prbMatch[4] === '1';

            if (!probeSuccess) {
                // Probe failed - abort
                setWarnings(['Probe failed - probe did not make contact']);
                isAbortedRef.current = true;
                setState((prev) => ({ ...prev, isProbing: false }));
                setProbeStatus('error');
                return;
            }

            // Store the Z value
            probeZValuesRef.current.push(zValue);

            // Update progress
            const newIndex = currentProbeIndexRef.current + 1;
            setState((prev) => ({
                ...prev,
                probeProgress: (newIndex / probePointsRef.current.length) * 100,
                currentProbeIndex: newIndex,
            }));

            // Move to next point or complete
            currentProbeIndexRef.current = newIndex;
            if (
                currentProbeIndexRef.current < probePointsRef.current.length &&
                !isAbortedRef.current
            ) {
                // Short delay before probing next point to allow machine to settle
                setTimeout(() => {
                    if (isAbortedRef.current) return;
                    const nextPoint = probePointsRef.current[currentProbeIndexRef.current];
                    const command = generateSingleProbeCommand(
                        nextPoint.x,
                        nextPoint.y,
                        state.zClearance,
                        state.probeFeedRate,
                        state.maxProbeDepth,
                    );
                    controller.command('gcode:safe', command, 'G21');
                }, 100);
            } else if (!isAbortedRef.current) {
                // Probing complete
                completeProbing();
            }
        },
        [state.isProbing, state.zClearance, state.probeFeedRate, state.maxProbeDepth, completeProbing],
    );

    // Set up controller event listeners for probe results
    useEffect(() => {
        const controllerEvents = {
            'serialport:read': handleSerialRead,
        };

        addControllerEvents(controllerEvents);

        return () => {
            removeControllerEvents(controllerEvents);
        };
    }, [handleSerialRead]);

    // Start probing routine
    const startProbing = useCallback(() => {
        // Calculate probe points
        const points = calculateProbeGrid(
            state.minX,
            state.maxX,
            state.minY,
            state.maxY,
            state.gridSpacing,
            state.usePointCount,
            state.pointCountX,
            state.pointCountY,
        );

        if (points.length < 4) {
            setWarnings(['Need at least 4 probe points (2x2 grid minimum)']);
            return;
        }

        // Reset state
        probePointsRef.current = points;
        probeZValuesRef.current = [];
        currentProbeIndexRef.current = 0;
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

        // Start with first point
        const firstPoint = points[0];
        const command = generateSingleProbeCommand(
            firstPoint.x,
            firstPoint.y,
            state.zClearance,
            state.probeFeedRate,
            state.maxProbeDepth,
        );
        controller.command('gcode:safe', command, 'G21');
    }, [state]);

    // Abort probing
    const abortProbing = useCallback(() => {
        isAbortedRef.current = true;
        controller.command('feedhold');
        controller.command('reset');

        setProbeStatus('idle');
        setState((prev) => ({
            ...prev,
            isProbing: false,
            lastError: 'Probing aborted by user',
        }));
    }, []);

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

                    // Get config from file or calculate defaults
                    const config = data.config;

                    // Calculate grid spacing from the map points if not stored
                    let gridSpacing = config?.gridSpacing ?? 10;
                    if (!config?.gridSpacing && data.points.length > 1) {
                        const uniqueX = [...new Set(data.points.map(p => p.x))].sort((a, b) => a - b);
                        if (uniqueX.length > 1) {
                            gridSpacing = uniqueX[1] - uniqueX[0];
                        }
                    }

                    // Calculate point counts from resolution or derive from points
                    const pointCountX = data.resolution?.x || [...new Set(data.points.map(p => p.x))].length;
                    const pointCountY = data.resolution?.y || [...new Set(data.points.map(p => p.y))].length;

                    // Update state with map data AND all config values from the loaded map
                    setState((prev) => ({
                        ...prev,
                        mapData: data,
                        // Bounds
                        minX: data.bounds.minX,
                        maxX: data.bounds.maxX,
                        minY: data.bounds.minY,
                        maxY: data.bounds.maxY,
                        // Grid resolution
                        gridSpacing,
                        usePointCount: config?.usePointCount ?? prev.usePointCount,
                        pointCountX,
                        pointCountY,
                        // Probing safety
                        zClearance: config?.zClearance ?? prev.zClearance,
                        probeFeedRate: config?.probeFeedRate ?? prev.probeFeedRate,
                        maxProbeDepth: config?.maxProbeDepth ?? prev.maxProbeDepth,
                        // Transform settings
                        segmentLength: config?.segmentLength ?? prev.segmentLength,
                    }));
                    setWarnings([]);
                } catch (err) {
                    setWarnings(['Failed to parse map file']);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, []);

    // Clear height map
    const clearMap = useCallback(() => {
        setState((prev) => ({ ...prev, mapData: null }));
        probeZValuesRef.current = [];
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
        const { transformedGcode: gcode } = transformGcode(fileInfo.content, state.mapData, {
            segmentLength: state.segmentLength,
            warnOutsideBounds: false,
        });

        setTransformedGcode(gcode);

        // Upload to secondary visualizer
        const name = `${fileInfo.name?.replace('.gcode', '') || 'gcode'}_heightmap.gcode`;
        const file = new File([gcode], name, { type: 'text/plain' });
        await uploadGcodeFileToServer(file, controller.port, VISUALIZER_SECONDARY);

        setWarnings([`Height map applied. Preview updated.`]);
    }, [state.mapData, state.segmentLength, fileInfo, mainVisualizerHasHeightMap]);

    // Confirm double-apply (user wants to proceed anyway)
    const confirmDoubleApply = useCallback(async () => {
        setShowDoubleApplyWarning(false);

        if (!state.mapData || !fileInfo?.content) return;

        // Perform the transformation - this will compound the adjustment since
        // the file already has height map applied
        const { transformedGcode: gcode } = transformGcode(fileInfo.content, state.mapData, {
            segmentLength: state.segmentLength,
            warnOutsideBounds: false,
        });

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
        const gcodeToExport = transformedGcode || (state.mapData && fileInfo?.content
            ? transformGcode(fileInfo.content, state.mapData, {
                segmentLength: state.segmentLength,
                warnOutsideBounds: false,
            }).transformedGcode
            : null);

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

                    {/* Grid Bounds */}
                    <div className="border rounded p-2 dark:border-gray-600">
                        <div className="text-sm font-medium mb-1">Grid Bounds</div>
                        <InputArea label="X Range">
                            <div className="grid grid-cols-[1fr_16px_1fr_auto] gap-1 col-span-3 items-center">
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    className={inputStyle}
                                    value={state.minX}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('minX', Number(e.target.value))
                                    }
                                />
                                <span className="text-center text-sm">-</span>
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    className={inputStyle}
                                    value={state.maxX}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('maxX', Number(e.target.value))
                                    }
                                />
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
                            <div className="grid grid-cols-[1fr_16px_1fr_auto] gap-1 col-span-3 items-center">
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    className={inputStyle}
                                    value={state.minY}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('minY', Number(e.target.value))
                                    }
                                />
                                <span className="text-center text-sm">-</span>
                                <ControlledInput
                                    type="number"
                                    suffix={units}
                                    className={inputStyle}
                                    value={state.maxY}
                                    immediateOnChange
                                    onChange={(e) =>
                                        updateField('maxY', Number(e.target.value))
                                    }
                                />
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

                        <div className="flex justify-end gap-2 mt-2">
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
                                    disabled={!state.mapData && !state.isProbing}
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
