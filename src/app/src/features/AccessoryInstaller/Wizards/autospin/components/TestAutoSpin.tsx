import RangeSlider from "app/components/RangeSlider";
import { ActiveStateButton } from "app/components/ActiveStateButton";
import { OVERRIDE_VALUE_RANGES } from "app/constants";
import { useTypedSelector } from "app/hooks/useTypedSelector.ts";
import controller from "app/lib/controller.ts";
import type { RootState } from "app/store/redux";
import debounce from "lodash/debounce";
import { useEffect, useState } from "react";
import { FaBan, FaPlay } from "react-icons/fa";

const debouncedSpindleOverrideHandler = debounce((value: number) => {
	controller.command("spindleOverride", Number(value));
}, 1000);

interface Props {
	onComplete: () => void;
}

export function TestAutoSpin({ onComplete }: Props) {
	const isConnected = useTypedSelector(
		(state: RootState) => state.connection.isConnected,
	);
	const spindle = useTypedSelector(
		(state: RootState) => state.controller.state?.status?.spindle,
	);
	const ovS = useTypedSelector(
		(state: RootState) => state.controller.state?.status?.ov?.[2] ?? 100,
	);

	const [localOvS, setLocalOvS] = useState(ovS);
	const [spindleRunning, setSpindleRunning] = useState(false);

	useEffect(() => {
		setLocalOvS(ovS);
	}, [ovS]);

	function handleStart() {
		controller.command("gcode", `M3 S${spindle || 1000}`);
		setSpindleRunning(true);
		onComplete();
	}

	function handleStop() {
		controller.command("gcode", "M5 S0");
		setSpindleRunning(false);
	}

	return (
		<div className="flex flex-col gap-5 justify-start">
			<p className="dark:text-content-primary">
				Test your AutoSpin setup by running the spindle at a set speed.
			</p>
			<ol className="list-decimal p-5 gap-4 space-y-2 text-gray-900 dark:text-content-primary">
				<li>Turn the AutoSpin dial to "S"</li>
				<li>Turn on the spindle using the power toggle</li>
				<li>
					Press <b>"Start"</b> to run the spindle (M3)
				</li>
			</ol>
			<RangeSlider
				step={10}
				min={OVERRIDE_VALUE_RANGES.MIN}
				max={OVERRIDE_VALUE_RANGES.MAX}
				value={String(spindle ?? 0)}
				percentage={[localOvS]}
				defaultPercentage={[100]}
				showText={true}
				title="Spindle"
				unitString="RPM"
				colour={isConnected ? "bg-red-400" : "bg-gray-500"}
				disabled={!isConnected}
				onChange={(values: number[]) => setLocalOvS(values[0])}
				onButtonPress={(values: number[]) => {
					setLocalOvS(values[0]);
					debouncedSpindleOverrideHandler(values[0]);
				}}
				onPointerUp={() => debouncedSpindleOverrideHandler(localOvS)}
				id="autospin-test-override"
			/>
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
