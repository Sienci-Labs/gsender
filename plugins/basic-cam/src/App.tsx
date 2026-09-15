import { gcode as gcodeClient } from '@sienci/gsender-plugin-sdk';
import { useWorkspaceState } from '@sienci/gsender-plugin-sdk/react';
import {
    type GCodeViewerHandle,
    GCodeVisualizer,
} from '@sienci/gsender-plugin-sdk/viewer';
import { useEffect, useMemo, useRef, useState } from 'react';

import { generateGcode, type Operation, type Units } from './gcode';

type WorkspaceState = {
    units?: string;
    [key: string]: unknown;
};

type NumberFieldProps = {
    label: string;
    value: number;
    step?: number;
    min?: number;
    unit?: string;
    onChange: (value: number) => void;
    unitId?: string; // a testid for the units
};

type PreviewTab = 'preview' | 'gcode';

const NumberField = ({
    label,
    value,
    step,
    min,
    unit,
    onChange,
    unitId,
}: NumberFieldProps) => (
    <label className="mb-3 flex flex-col gap-1 text-sm">
        <span>
            {label}
            {unit ? (
                <span
                    className="font-normal text-gray-500 dark:text-gray-400"
                    id={unitId}
                >
                    {' '}
                    ({unit})
                </span>
            ) : null}
        </span>
        <input
            type="number"
            value={value}
            step={step}
            min={min}
            onChange={(event) => onChange(event.target.valueAsNumber || 0)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
        />
    </label>
);

const App = () => {
    const workspace = useWorkspaceState<WorkspaceState>();
    const units: Units = workspace?.units === 'in' ? 'in' : 'mm';

    const [operation, setOperation] = useState<Operation>('rectangle');
    const [rect, setRect] = useState({ width: 50, height: 30, depth: 2 });
    const [grid, setGrid] = useState({
        cols: 3,
        rows: 3,
        spacingX: 20,
        spacingY: 20,
        depth: 5,
    });
    const [tool, setTool] = useState({
        feedrate: 800,
        plungeRate: 200,
        spindleRpm: 12000,
        safeZ: 5,
    });

    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<PreviewTab>('preview');

    const gcode = useMemo(() => {
        if (operation === 'drill-grid') {
            return generateGcode({ operation, units, ...tool, ...grid });
        }
        return generateGcode({ operation, units, ...tool, ...rect });
    }, [operation, units, tool, rect, grid]);

    // gviewer's <GCodeVisualizer> is driven imperatively through its ref: load the
    // generated program with loadFromText, then fit the camera to the model.
    const viewerRef = useRef<GCodeViewerHandle>(null);
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) {
            return;
        }
        viewer
            .loadFromText(gcode)
            .then(() => viewer.focusToModel())
            .catch((err) => console.error('Preview failed to load', err));
    }, [gcode]);

    useEffect(() => {
        viewerRef.current?.setOptions({ units });
    }, [units]);

    // Refit the camera when returning to the preview tab — the canvas may have
    // been hidden while the gcode panel was active.
    useEffect(() => {
        if (activeTab !== 'preview') {
            return;
        }
        const frame = requestAnimationFrame(() => {
            viewerRef.current?.focusToModel();
        });
        return () => cancelAnimationFrame(frame);
    }, [activeTab]);

    // "Load to main visualizer" hands the generated program to gSender's main visualizer via
    // the SDK. Basic CAM is just a plugin — it has no privileged host access, it
    // composes gSender's generic SDK surface to do its work.
    const loadToMainVisualizer = async () => {
        setLoading(true);
        setStatus('');
        try {
            const name =
                operation === 'drill-grid'
                    ? 'basic-cam-drill-grid.gcode'
                    : 'basic-cam-rectangle.gcode';
            await gcodeClient.loadToVisualizer(gcode, name);
            setStatus('G-code loaded into gSender.');
        } catch (err) {
            setStatus(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    };

    const fieldsetClass =
        'mb-4 rounded-lg border border-gray-300 p-4 dark:border-gray-700';
    const legendClass = 'px-1 font-semibold';
    const tabClass = (tab: PreviewTab) =>
        [
            'relative -mb-px cursor-pointer border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
            activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200',
        ].join(' ');

    return (
        <div className="text-gray-900 dark:text-gray-100">
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-[minmax(280px,360px)_1fr]">
                <div>
                    <fieldset className={fieldsetClass}>
                        <legend className={legendClass}>Operation</legend>
                        <label className="flex flex-col gap-1 text-sm">
                            Type
                            <select
                                value={operation}
                                onChange={(event) =>
                                    setOperation(
                                        event.target.value as Operation,
                                    )
                                }
                                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="rectangle">
                                    Rectangle profile
                                </option>
                                <option value="drill-grid">Drill grid</option>
                            </select>
                        </label>
                    </fieldset>

                    {operation === 'rectangle' ? (
                        <fieldset className={fieldsetClass}>
                            <legend className={legendClass}>Rectangle</legend>
                            <NumberField
                                label="Width"
                                unit={units}
                                value={rect.width}
                                step={0.1}
                                onChange={(width) =>
                                    setRect((r) => ({ ...r, width }))
                                }
                            />
                            <NumberField
                                label="Height"
                                unit={units}
                                value={rect.height}
                                step={0.1}
                                onChange={(height) =>
                                    setRect((r) => ({ ...r, height }))
                                }
                            />
                            <NumberField
                                label="Depth"
                                unit={units}
                                value={rect.depth}
                                step={0.1}
                                onChange={(depth) =>
                                    setRect((r) => ({ ...r, depth }))
                                }
                            />
                        </fieldset>
                    ) : (
                        <fieldset className={fieldsetClass}>
                            <legend className={legendClass}>Drill grid</legend>
                            <NumberField
                                label="Columns"
                                value={grid.cols}
                                min={1}
                                step={1}
                                onChange={(cols) =>
                                    setGrid((g) => ({ ...g, cols }))
                                }
                            />
                            <NumberField
                                label="Rows"
                                value={grid.rows}
                                min={1}
                                step={1}
                                onChange={(rows) =>
                                    setGrid((g) => ({ ...g, rows }))
                                }
                            />
                            <NumberField
                                label="Spacing X"
                                unit={units}
                                value={grid.spacingX}
                                step={0.1}
                                onChange={(spacingX) =>
                                    setGrid((g) => ({ ...g, spacingX }))
                                }
                            />
                            <NumberField
                                label="Spacing Y"
                                unit={units}
                                value={grid.spacingY}
                                step={0.1}
                                onChange={(spacingY) =>
                                    setGrid((g) => ({ ...g, spacingY }))
                                }
                            />
                            <NumberField
                                label="Depth"
                                unit={units}
                                value={grid.depth}
                                step={0.1}
                                onChange={(depth) =>
                                    setGrid((g) => ({ ...g, depth }))
                                }
                            />
                        </fieldset>
                    )}

                    <fieldset className={fieldsetClass}>
                        <legend className={legendClass}>
                            Tool &amp; feeds
                        </legend>
                        <NumberField
                            label="Feedrate"
                            unit={`${units}/min`}
                            value={tool.feedrate}
                            step={10}
                            onChange={(feedrate) =>
                                setTool((t) => ({ ...t, feedrate }))
                            }
                            unitId="width-field"
                        />
                        <NumberField
                            label="Plunge rate"
                            unit={`${units}/min`}
                            value={tool.plungeRate}
                            step={10}
                            onChange={(plungeRate) =>
                                setTool((t) => ({ ...t, plungeRate }))
                            }
                        />
                        <NumberField
                            label="Spindle RPM"
                            value={tool.spindleRpm}
                            step={100}
                            onChange={(spindleRpm) =>
                                setTool((t) => ({ ...t, spindleRpm }))
                            }
                        />
                        <NumberField
                            label="Safe Z"
                            unit={units}
                            value={tool.safeZ}
                            step={0.1}
                            onChange={(safeZ) =>
                                setTool((t) => ({ ...t, safeZ }))
                            }
                        />
                    </fieldset>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={loadToMainVisualizer}
                            disabled={loading}
                            className="cursor-pointer rounded-md border border-blue-500 bg-blue-500 px-3.5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? 'Loading…' : 'Load to main visualizer'}
                        </button>
                    </div>
                    {status && (
                        <p className="mt-2 text-sm text-gray-500">{status}</p>
                    )}
                </div>

                <div className="flex min-h-80 flex-col overflow-hidden md:min-h-0">
                    <div
                        className="flex shrink-0 gap-1 border-b border-gray-300 dark:border-gray-600"
                        role="tablist"
                        aria-label="Preview panels"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'preview'}
                            className={tabClass('preview')}
                            onClick={() => setActiveTab('preview')}
                        >
                            Preview
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'gcode'}
                            className={tabClass('gcode')}
                            onClick={() => setActiveTab('gcode')}
                        >
                            Generated G-code
                        </button>
                    </div>

                    <div className="relative mt-3 min-h-0 flex-1">
                        {/* Keep the visualizer mounted (and sized) so WebGL state survives tab switches. */}
                        <div
                            role="tabpanel"
                            aria-hidden={activeTab !== 'preview'}
                            className={`absolute inset-0 overflow-hidden rounded-lg bg-slate-950 ${
                                activeTab === 'preview'
                                    ? ''
                                    : 'invisible pointer-events-none'
                            }`}
                        >
                            <GCodeVisualizer
                                ref={viewerRef}
                                id="basic-cam-preview"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>

                        <div
                            role="tabpanel"
                            aria-hidden={activeTab !== 'gcode'}
                            className={`absolute inset-0 overflow-hidden rounded-lg ${
                                activeTab === 'gcode'
                                    ? ''
                                    : 'invisible pointer-events-none'
                            }`}
                        >
                            <pre className="h-full overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
                                {gcode}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
