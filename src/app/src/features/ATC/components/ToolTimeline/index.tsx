import { ToolTimeline } from "app/features/ATC/components/ToolTimeline/components/ToolTimeline.tsx";
import type { ToolChange } from "app/features/ATC/components/ToolTimeline/components/types.ts";
import { getToolpathColor } from "app/features/ATC/utils/ATCFunctions.ts";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import controller from "app/lib/controller.ts";
import { G1_PART } from "app/features/Visualizer/constants.ts";
import { getVisualizerTheme } from "app/lib/getVisualizerTheme.ts";
import type { RootState } from "app/store/redux";
import get from "lodash/get";
import pubsub from "pubsub-js";
import { useEffect, useState } from "react";

function buildToolArray(toolEvents, fileLength, cuttingColor: string) {
	// Palette starts at 1 — index 0 is visually similar to the default cutting
	// color and would be confusing as a "different tool" color.
	let paletteIdx = 1;
	let displayIdx = 2; // initial tool segment takes display index 1
	const toolchangeArray: ToolChange[] = [];

	Object.entries(toolEvents).forEach(([line, value]) => {
		if (Object.hasOwn(value, "M") && Object.hasOwn(value, "T")) {
			const newTool: ToolChange = {};
			newTool.toolNumber = value.T;
			newTool.startLine = Number(line);
			newTool.label = `T${value.T}`;
			if (value.comment) newTool.comment = value.comment;
			const legendColor = getToolpathColor(paletteIdx);
			newTool.color = `#${legendColor.getHexString()}`;
			newTool.index = displayIdx;
			toolchangeArray.push(newTool);
			paletteIdx++;
			displayIdx++;
		}
	});

	if (toolchangeArray.length === 0) {
		return [];
	}

	toolchangeArray[toolchangeArray.length - 1].endLine = fileLength;
	for (let i = toolchangeArray.length - 2; i >= 0; i--) {
		toolchangeArray[i].endLine = toolchangeArray[i + 1].startLine - 1;
	}

	// Prepend an entry for the initial tool segment (before the first toolchange).
	const initialTool: ToolChange = {
		index: 1,
		toolNumber: 0,
		label: "Initial",
		color: cuttingColor,
		startLine: 0,
		endLine: (toolchangeArray[0].startLine ?? 1) - 1,
	};

	return [initialTool, ...toolchangeArray];
}

export function ToolTimelineWrapper() {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [activeToolIndex, setActiveToolIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const [show, setShow] = useState(false);
	const [tools, setTools] = useState<ToolChange[]>([]);

	const fileLoaded = useTypedSelector(
		(state: RootState) => state.file.fileLoaded,
	);

	const linesReceived = useTypedSelector((state: RootState) => {
		return get(state, "controller.sender.status.received", 0);
	});

	useEffect(() => {
		if (tools.length === 0) {
			return;
		}
		if (linesReceived > tools[activeToolIndex].endLine) {
			setActiveToolIndex(activeToolIndex + 1);
		}
	}, [linesReceived]);

	useEffect(() => {
		pubsub.subscribe("file:toolchanges", (k, { toolEvents, total }) => {
			const cuttingColor = getVisualizerTheme().get(G1_PART) ?? "#3e85c7";
			const toolArray = buildToolArray(toolEvents, total, cuttingColor);

			if (toolArray.length === 0) {
				setShow(false);
				setTools([]);
				return;
			}
			setTools(toolArray);
			setActiveToolIndex(0);
			setProgress(0);
			setShow(true);
		});

		controller.addListener("job:stop", () => {
			setActiveToolIndex(0);
		});

		return () => {
			setShow(false);
			pubsub.unsubscribe("file:toolchanges");
		};
	}, []);

	useEffect(() => {
		if (!fileLoaded) {
			setShow(false);
			setTools([]);
			setActiveToolIndex(0);
		}
	}, [fileLoaded]);

	if (!show) {
		return <div></div>;
	}

	return (
		<div className="absolute top-4 left-4 z-10">
			<ToolTimeline
				tools={tools}
				activeToolIndex={activeToolIndex}
				progress={progress}
				isCollapsed={isCollapsed}
				onToggle={() => setIsCollapsed(!isCollapsed)}
			/>
		</div>
	);
}
