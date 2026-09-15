import { ActiveStateButton } from "app/components/ActiveStateButton";
import { Slider } from "app/components/shadcn/Slider";
import Tooltip from "app/components/Tooltip";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import controller from "app/lib/controller.ts";
import type { RootState } from "app/store/redux";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useState } from "react";
import { FaBan, FaPlay } from "react-icons/fa";

const SPINDLE_STEP = 100;

const debouncedSpindleSpeedHandler = debounce((value: number) => {
	controller.command("spindlespeed:change", Number(value));
}, 300);

interface Props {
	onComplete: () => void;
}

export function TestAutoSpin({ onComplete }: Props) {
	const isConnected = useTypedSelector(
		(state: RootState) => state.connection.isConnected,
	);
	const spindleMin = useTypedSelector((state: RootState) =>
		Number(state.controller.settings.settings.$31 ?? 1000),
	);
	const spindleMax = useTypedSelector((state: RootState) =>
		Number(state.controller.settings.settings.$30 ?? 30000),
	);
	const spindleModal = useTypedSelector(
		(state: RootState) => state.controller.modal.spindle ?? "M5",
	);
	const reportedSpindle = useTypedSelector(
		(state: RootState) => state.controller.state?.status?.spindle,
	);

	const spindleRunning = spindleModal !== "M5";

	const clamp = useCallback(
		(value: number) => Math.max(spindleMin, Math.min(spindleMax, value)),
		[spindleMin, spindleMax],
	);

	const [rpm, setRpm] = useState(() => clamp(spindleMin));

	// Keep the selected speed inside the range when the firmware settings arrive
	useEffect(() => {
		setRpm((prev) => clamp(prev));
	}, [clamp]);

	function handleChange(values: number[]) {
		const value = clamp(values[0]);
		setRpm(value);
		if (spindleRunning) {
			debouncedSpindleSpeedHandler(value);
		}
	}

	function handleStart() {
		controller.command("gcode", `M3 S${rpm}`);
		onComplete();
	}

	function handleStop() {
		debouncedSpindleSpeedHandler.cancel();
		controller.command("gcode", "M5");
	}

	return (
		<div className="flex flex-col gap-5 justify-start">
			<p className="dark:text-content-primary">
				Test your AutoSpin setup by running the spindle at a set speed.
			</p>
			<ol className="list-decimal p-5 gap-4 space-y-2 text-gray-900 dark:text-content-primary">
				<li>Turn the AutoSpin dial to "S"</li>
				<li>Turn on the spindle using the power toggle</li>
				<li>Choose a speed with the slider</li>
				<li>
					Press <b>"Start"</b> to run the spindle (M3)
				</li>
			</ol>
			<div className="grid grid-cols-[1fr_3fr_1fr] gap-2 justify-center items-center text-gray-900 dark:text-content-primary">
				<span className="text-right">Speed</span>
				<Tooltip content="Adjust spindle speed" side="bottom">
					<Slider
						value={[rpm]}
						min={spindleMin}
						max={spindleMax}
						step={SPINDLE_STEP}
						className="h-8 w-full"
						onValueChange={handleChange}
						disabled={!isConnected}
						aria-label="Adjust spindle speed"
						id="autospin-test-speed"
					/>
				</Tooltip>
				<div className="w-[10ch] text-left">{rpm} RPM</div>
			</div>
			<div className="text-center text-sm text-gray-500 dark:text-content-muted">
				Range {spindleMin} - {spindleMax} RPM ($31 - $30)
				{spindleRunning && reportedSpindle !== undefined
					? ` · reporting ${reportedSpindle} RPM`
					: ""}
			</div>
			<div className="flex flex-row gap-2 justify-center">
				<ActiveStateButton
					onClick={handleStart}
					disabled={!isConnected}
					icon={<FaPlay />}
					text="Start"
					active={isConnected && spindleRunning}
					tooltip={{ content: "Run spindle clockwise (M3)" }}
					aria-label="Start spindle clockwise (M3)"
				/>
				<ActiveStateButton
					onClick={handleStop}
					disabled={!isConnected}
					icon={<FaBan />}
					text="Stop"
					tooltip={{ content: "Stop spindle (M5)" }}
					aria-label="Stop spindle (M5)"
				/>
			</div>
		</div>
	);
}
