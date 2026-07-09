import { gsender } from "@sienci/gsender-plugin-sdk";
import { useWorkspaceState } from "@sienci/gsender-plugin-sdk/react";
import {
	GCodeVisualizer,
	type GCodeViewerHandle,
} from "@sienci/gsender-plugin-sdk/viewer";
import { useEffect, useMemo, useRef, useState } from "react";

import { generateGcode, type Operation, type Units } from "./gcode";

type WorkspaceState = {
	units?: string;
	[key: string]: unknown;
};

type NumberFieldProps = {
	label: string;
	value: number;
	step?: number;
	min?: number;
	onChange: (value: number) => void;
};

const NumberField = ({ label, value, step, min, onChange }: NumberFieldProps) => (
	<label className="mb-3 flex flex-col gap-1 text-sm">
		{label}
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
	const units: Units = workspace?.units === "in" ? "in" : "mm";

	const [operation, setOperation] = useState<Operation>("rectangle");
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

	const [status, setStatus] = useState("");
	const [loading, setLoading] = useState(false);

	const gcode = useMemo(() => {
		if (operation === "drill-grid") {
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
			.catch((err) => console.error("Preview failed to load", err));
	}, [gcode]);

	useEffect(() => {
		viewerRef.current?.setOptions({ units });
	}, [units]);

	// "Load to job" hands the generated program to gSender's main visualizer via
	// the SDK. Basic CAM is just a plugin — it has no privileged host access, it
	// composes gSender's generic SDK surface to do its work.
	const loadToJob = async () => {
		setLoading(true);
		setStatus("");
		try {
			const name =
				operation === "drill-grid"
					? "basic-cam-drill-grid.gcode"
					: "basic-cam-rectangle.gcode";
			await gsender.gcode.loadToVisualizer(gcode, name);
			setStatus("G-code loaded into gSender.");
		} catch (err) {
			setStatus(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	const fieldsetClass =
		"mb-4 rounded-lg border border-gray-300 p-4 dark:border-gray-700";
	const legendClass = "px-1 font-semibold";

	return (
		<div className="text-gray-900 dark:text-gray-100">
			<h1 className="mt-0 text-xl font-semibold">Basic CAM</h1>
			<p className="text-sm text-gray-500">Workspace units: {units}</p>

			<div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(280px,360px)_1fr]">
				<div>
					<fieldset className={fieldsetClass}>
						<legend className={legendClass}>Operation</legend>
						<label className="flex flex-col gap-1 text-sm">
							Type
							<select
								value={operation}
								onChange={(event) =>
									setOperation(event.target.value as Operation)
								}
								className="rounded-md border border-gray-300 bg-white px-2 py-1.5 dark:border-gray-700 dark:bg-gray-800"
							>
								<option value="rectangle">Rectangle profile</option>
								<option value="drill-grid">Drill grid</option>
							</select>
						</label>
					</fieldset>

					{operation === "rectangle" ? (
						<fieldset className={fieldsetClass}>
							<legend className={legendClass}>Rectangle</legend>
							<NumberField
								label="Width"
								value={rect.width}
								step={0.1}
								onChange={(width) => setRect((r) => ({ ...r, width }))}
							/>
							<NumberField
								label="Height"
								value={rect.height}
								step={0.1}
								onChange={(height) => setRect((r) => ({ ...r, height }))}
							/>
							<NumberField
								label="Depth"
								value={rect.depth}
								step={0.1}
								onChange={(depth) => setRect((r) => ({ ...r, depth }))}
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
								onChange={(cols) => setGrid((g) => ({ ...g, cols }))}
							/>
							<NumberField
								label="Rows"
								value={grid.rows}
								min={1}
								step={1}
								onChange={(rows) => setGrid((g) => ({ ...g, rows }))}
							/>
							<NumberField
								label="Spacing X"
								value={grid.spacingX}
								step={0.1}
								onChange={(spacingX) => setGrid((g) => ({ ...g, spacingX }))}
							/>
							<NumberField
								label="Spacing Y"
								value={grid.spacingY}
								step={0.1}
								onChange={(spacingY) => setGrid((g) => ({ ...g, spacingY }))}
							/>
							<NumberField
								label="Depth"
								value={grid.depth}
								step={0.1}
								onChange={(depth) => setGrid((g) => ({ ...g, depth }))}
							/>
						</fieldset>
					)}

					<fieldset className={fieldsetClass}>
						<legend className={legendClass}>Tool &amp; feeds</legend>
						<NumberField
							label="Feedrate"
							value={tool.feedrate}
							step={10}
							onChange={(feedrate) => setTool((t) => ({ ...t, feedrate }))}
						/>
						<NumberField
							label="Plunge rate"
							value={tool.plungeRate}
							step={10}
							onChange={(plungeRate) => setTool((t) => ({ ...t, plungeRate }))}
						/>
						<NumberField
							label="Spindle RPM"
							value={tool.spindleRpm}
							step={100}
							onChange={(spindleRpm) => setTool((t) => ({ ...t, spindleRpm }))}
						/>
						<NumberField
							label="Safe Z"
							value={tool.safeZ}
							step={0.1}
							onChange={(safeZ) => setTool((t) => ({ ...t, safeZ }))}
						/>
					</fieldset>

					<div className="mt-4 flex flex-wrap gap-2">
						<button
							type="button"
							onClick={loadToJob}
							disabled={loading}
							className="cursor-pointer rounded-md border border-blue-600 bg-blue-600 px-3.5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
						>
							{loading ? "Loading…" : "Load to job"}
						</button>
					</div>
					{status && <p className="mt-2 text-sm text-gray-500">{status}</p>}
				</div>

				<div>
					<h2 className="mt-0 mb-2 text-base font-semibold">Preview</h2>
					<div className="mb-4 h-80 overflow-hidden rounded-lg bg-slate-950">
						<GCodeVisualizer
							ref={viewerRef}
							id="basic-cam-preview"
							style={{ width: "100%", height: "100%" }}
						/>
					</div>

					<h2 className="mt-0 mb-2 text-base font-semibold">Generated G-code</h2>
					<pre className="max-h-80 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800">
						{gcode}
					</pre>
				</div>
			</div>
		</div>
	);
};

export default App;
