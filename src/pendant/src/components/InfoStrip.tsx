import { useEffect, useState } from "react";
import cx from "classnames";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import type { RootState } from "app/store/redux";
import { GRBLHAL } from "app/constants";

function Clock() {
	const [time, setTime] = useState(() =>
		new Date().toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
		}),
	);
	useEffect(() => {
		const id = setInterval(() => {
			setTime(
				new Date().toLocaleTimeString("en-US", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: false,
				}),
			);
		}, 1000);
		return () => clearInterval(id);
	}, []);
	return <span>{time}</span>;
}

function Field({ label, value }: { label: string; value: string }) {
	return (
		<span className="flex flex-col items-center leading-tight">
			<span className="text-[9px] leading-[1.4] text-gray-400 dark:text-content-muted">
				{label}
			</span>
			<span className="font-mono text-[11px] leading-[1.4] text-gray-700 dark:text-content-primary">
				{value}
			</span>
		</span>
	);
}

function Divider() {
	return (
		<span className="w-px self-stretch bg-gray-200 dark:bg-outline" />
	);
}

function Pin({ label, on }: { label: string; on: boolean }) {
	return (
		<span className="flex flex-col items-center gap-[3px]">
			<span
				className={cx("h-[7px] w-[7px] rounded-full", {
					"bg-green-500": on,
					"bg-red-500": !on,
				})}
				aria-label={on ? "Asserted" : "Not asserted"}
				title={`${label}: ${on ? "asserted" : "not asserted"}`}
			/>
			<span className="text-[9px] leading-none text-gray-400 dark:text-content-muted">
				{label}
			</span>
		</span>
	);
}

const UNITS_LABEL: Record<string, string> = { G20: "in", G21: "mm" };
const DIST_LABEL: Record<string, string> = { G90: "abs", G91: "inc" };
const COOLANT_LABEL: Record<string, string> = {
	M9: "off",
	M8: "flood",
	M7: "mist",
};
const PIN_LABELS: { key: string; label: string }[] = [
	{ key: "X", label: "X" },
	{ key: "Y", label: "Y" },
	{ key: "Z", label: "Z" },
	{ key: "A", label: "A" },
	{ key: "P", label: "Pb" },
	{ key: "D", label: "Dr" },
	{ key: "H", label: "Ho" },
];

export default function InfoStrip() {
	const controllerType = useTypedSelector(
		(state: RootState) => state.controller.type,
	);
	const currentTool = useTypedSelector(
		(state: RootState) => (state.controller.state.status as any)?.currentTool,
	);
	const pins = useTypedSelector(
		(state: RootState) =>
			(state.controller.state.status as any)?.pinState as
				| Record<string, boolean>
				| undefined,
	);
	const modal = useTypedSelector((state: RootState) => state.controller.modal);
	const isConnected = useTypedSelector(
		(state: RootState) => state.connection.isConnected,
	);
	const isLaserMode = useTypedSelector(
		(state: RootState) =>
			Number(state.controller.settings.settings.$32 ?? 0) === 1,
	);

	const showTool =
		controllerType === GRBLHAL &&
		currentTool != null &&
		Number(currentTool) >= 0;

	const spindleModal = modal?.spindle ?? "M5";
	const spindleActive = spindleModal !== "M5";
	const spindleLabel =
		spindleModal === "M3" ? "CW" : spindleModal === "M4" ? "CCW" : "off";

	const v = (value: string) => (isConnected ? value : "-");

	// TEMP: show all pins always (for A/B look comparison), instead of only
	// ones actually reported by the firmware.
	const activePins = PIN_LABELS;

	return (
		<div className="relative z-40 flex flex-wrap items-center gap-4 px-3 md:px-4 py-1.5 bg-white border-b border-gray-200 dark:bg-surface-base dark:border-outline shrink-0 text-xs sm:text-sm text-gray-500 dark:text-content-muted">
			{showTool && (
				<>
					<Field label="tool" value={`T${currentTool}`} />
					<Divider />
				</>
			)}

			<span className="flex flex-wrap items-center gap-3.5">
				<Field label="wcs" value={v(modal.wcs)} />
				<Field label="plane" value={v(modal.plane)} />
				<Field label="units" value={v(UNITS_LABEL[modal.units] ?? modal.units)} />
				<Field label="dist" value={v(DIST_LABEL[modal.distance] ?? modal.distance)} />
				<Field label="feed mode" value={v(modal.feedrate)} />
				<Field
					label="coolant"
					value={v(COOLANT_LABEL[modal.coolant] ?? modal.coolant)}
				/>
				<span className="flex flex-col items-center leading-tight">
					<span className="text-[9px] leading-[1.4] text-gray-400 dark:text-content-muted">
						{isLaserMode ? "laser" : "spindle"}
					</span>
					<span
						className={cx("font-mono text-[11px] leading-[1.4] text-gray-700 dark:text-content-primary", {
							"text-red-500 dark:text-red-500 animate-pulse": spindleActive && !isLaserMode,
							"text-purple-500 dark:text-purple-500 animate-pulse": spindleActive && isLaserMode,
						})}
					>
						{isConnected ? spindleLabel : "-"}
					</span>
				</span>
			</span>

			<span className="flex items-center gap-3.5 ml-auto">
				{activePins.length > 0 && (
					<span className="flex items-center gap-2.5">
						{activePins.map(({ key, label }) => (
							<Pin key={key} label={label} on={!!pins?.[key]} />
						))}
					</span>
				)}
				<span className="font-mono text-gray-400 dark:text-content-muted">
					<Clock />
				</span>
			</span>
		</div>
	);
}
