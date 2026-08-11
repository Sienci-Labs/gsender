import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import get from "lodash/get";
import {
	Crosshair,
	Home,
	CircleParking,
	LayoutGrid,
	ArrowRight,
} from "lucide-react";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import type { RootState } from "app/store/redux";
import controller from "app/lib/controller";
import {
	GRBL_ACTIVE_STATE_ALARM,
	GRBL_ACTIVE_STATE_IDLE,
	GRBL_ACTIVE_STATE_JOG,
	METRIC_UNITS,
	WORKFLOW_STATE_RUNNING,
} from "app/constants";
import { homeMachine, zeroAllAxes } from "app/features/DRO/utils/DRO";
import {
	WORKSPACE_TEXT_COLORS,
	isWorkspace,
} from "./WorkspaceSelector";
import { goToParkLocation } from "app/features/DRO/component/Parking";
import {
	BACK_LEFT,
	BACK_RIGHT,
	CENTER,
	FRONT_LEFT,
	FRONT_RIGHT,
	getMovementGCode,
} from "app/features/DRO/utils/RapidPosition";

type DrawerMode = "closed" | "minimal" | "expanded";
type MovementMode = "abs" | "inc" | "mcs";

interface Props {
	mode: DrawerMode;
	setMode: (mode: DrawerMode) => void;
}

const HOLD_MS = 700;
const SETTLE_MS = 900;
const STEP_SIZES = [0.1, 1, 10] as const;

type CornerId =
	| typeof FRONT_RIGHT
	| typeof FRONT_LEFT
	| typeof BACK_RIGHT
	| typeof BACK_LEFT
	| typeof CENTER;

const CORNERS: {
	id: CornerId;
	label: string;
	position: string;
	size: number;
}[] = [
	{ id: BACK_LEFT, label: "Rear Left", position: "top-0 left-0 -translate-x-1/2 -translate-y-1/2", size: 64 },
	{ id: BACK_RIGHT, label: "Rear Right", position: "top-0 right-0 translate-x-1/2 -translate-y-1/2", size: 64 },
	{ id: FRONT_LEFT, label: "Front Left", position: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", size: 64 },
	{ id: FRONT_RIGHT, label: "Front Right", position: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", size: 64 },
	{ id: CENTER, label: "Center", position: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", size: 52 },
];

const VARIANT_CHROME: Record<
	"primary" | "secondary" | "neutral" | "navigate",
	string
> = {
	primary:
		"border-robin-500 bg-robin-50 dark:bg-robin-500/10 hover:bg-robin-100 dark:hover:bg-robin-500/20",
	navigate:
		"border-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20",
	secondary:
		"border-gray-300 dark:border-outline bg-white dark:bg-surface-elevated hover:bg-gray-50 dark:hover:bg-surface-hover",
	neutral:
		"border-gray-300 dark:border-outline bg-white dark:bg-surface-elevated hover:bg-gray-50 dark:hover:bg-surface-hover",
};

const VARIANT_TEXT: Record<
	"primary" | "secondary" | "neutral" | "navigate",
	string
> = {
	primary: "text-robin-600 dark:text-robin-400",
	navigate: "text-blue-600 dark:text-blue-400",
	secondary: "text-gray-600 dark:text-content-secondary",
	neutral: "text-gray-600 dark:text-content-secondary",
};

function QuickActionButton({
	label,
	Icon,
	onClick,
	disabled,
	variant,
	textClassName,
}: {
	label: string;
	Icon: React.ComponentType<{ size?: number }>;
	onClick: () => void;
	disabled: boolean;
	variant: "primary" | "secondary" | "neutral" | "navigate";
	textClassName?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={clsx(
				"flex-1 min-h-16 flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-[11px] font-semibold uppercase tracking-wide transition-colors",
				disabled
					? "border-gray-200 dark:border-outline bg-gray-100 dark:bg-surface-disabled text-gray-400 dark:text-content-disabled cursor-default"
					: clsx(VARIANT_CHROME[variant], textClassName ?? VARIANT_TEXT[variant]),
			)}
		>
			<Icon size={20} />
			{label}
		</button>
	);
}

function HoldCorner({
	corner,
	selected,
	disabled,
	onConfirm,
}: {
	corner: (typeof CORNERS)[number];
	selected: boolean;
	disabled: boolean;
	onConfirm: (id: CornerId) => void;
}) {
	const [progress, setProgress] = useState(0);
	const [holding, setHolding] = useState(false);
	const [confirmed, setConfirmed] = useState(false);
	const [settling, setSettling] = useState(false);

	const rafRef = useRef<number | null>(null);
	const startRef = useRef(0);
	const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
		},
		[],
	);

	const cancelHold = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		setHolding(false);
		setProgress(0);
	}, []);

	const startHold = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();
			if (disabled || settling) return;
			setHolding(true);
			startRef.current = performance.now();

			const step = (now: number) => {
				const elapsed = now - startRef.current;
				const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
				setProgress(pct);
				if (pct >= 100) {
					setHolding(false);
					setConfirmed(true);
					setSettling(true);
					onConfirm(corner.id);
					if (navigator.vibrate) navigator.vibrate(12);
					settleTimeoutRef.current = setTimeout(() => {
						setConfirmed(false);
						setSettling(false);
						setProgress(0);
					}, SETTLE_MS);
				} else {
					rafRef.current = requestAnimationFrame(step);
				}
			};
			rafRef.current = requestAnimationFrame(step);
		},
		[corner.id, disabled, onConfirm, settling],
	);

	return (
		<button
			type="button"
			className={clsx(
				"absolute rounded-full border-2 flex items-center justify-center transition-transform touch-none select-none",
				corner.position,
				holding && "scale-110",
				confirmed
					? "border-green-500 bg-green-100 dark:bg-green-500/15 text-green-600 dark:text-green-400"
					: selected
						? "border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
						: "border-gray-300 dark:border-outline bg-white dark:bg-surface-elevated text-gray-500 dark:text-content-secondary",
			)}
			style={{ width: corner.size, height: corner.size }}
			disabled={disabled || settling}
			onPointerDown={startHold}
			onPointerUp={cancelHold}
			onPointerLeave={cancelHold}
			onPointerCancel={cancelHold}
			onContextMenu={(e) => e.preventDefault()}
		>
			{(holding || confirmed) && (
				<span
					aria-hidden="true"
					className="absolute rounded-full pointer-events-none"
					style={{
						inset: -6,
						background: `conic-gradient(${confirmed ? "#22c55e" : "#689AC9"} ${progress * 3.6}deg, transparent 0deg)`,
						WebkitMask:
							"radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
						mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
					}}
				/>
			)}
			<span className="text-[10px] font-bold uppercase leading-none z-10">
				{corner.id === CENTER ? "CTR" : corner.id}
			</span>
		</button>
	);
}

export default function MovePanel({ mode, setMode }: Props) {
	const isConnected = useTypedSelector((s: RootState) => s.connection.isConnected);
	const workflowState = useTypedSelector((s: RootState) => s.controller.workflow.state);
	const activeState = useTypedSelector(
		(s: RootState) => s.controller.state.status?.activeState ?? "",
	);
	const alarmCode = useTypedSelector(
		(s: RootState) => s.controller.state.status?.alarmCode ?? 0,
	) as string | number;
	const hasHomed = useTypedSelector((s: RootState) => s.controller.hasHomed);
	const homingFlag = useTypedSelector((s: RootState) => s.controller.homingFlag);
	const homingSetting = useTypedSelector((s: RootState) =>
		get(s, "controller.settings.settings.$22", "0"),
	);
	const pullOff = useTypedSelector((s: RootState) =>
		Number(get(s, "controller.settings.settings.$27", 1)),
	);
	const activeWcs = useTypedSelector((s: RootState) => s.controller.modal.wcs) as
		| string
		| undefined;
	const controllerType = useTypedSelector((s: RootState) => s.controller.type);
	const axes = useTypedSelector((s: RootState) => s.controller.state.axes?.axes);
	const wpos = useTypedSelector((s: RootState) => s.controller.wpos);
	const mpos = useTypedSelector((s: RootState) => s.controller.mpos);

	const { mode: workspaceMode, units } = useWorkspaceState();

	const homingEnabled = Number(homingSetting) > 0;
	const isHomingAlarm =
		activeState === GRBL_ACTIVE_STATE_ALARM &&
		(alarmCode === 11 || alarmCode === "Homing");
	const canAct =
		isConnected &&
		workflowState !== WORKFLOW_STATE_RUNNING &&
		(activeState === GRBL_ACTIVE_STATE_IDLE || activeState === GRBL_ACTIVE_STATE_JOG);
	const canHome = (canAct && homingEnabled) || isHomingAlarm;
	const canCorner = canAct && hasHomed && !homingFlag;

	const [selectedCorner, setSelectedCorner] = useState<CornerId>(CENTER);

	const handleConfirmCorner = useCallback(
		(id: CornerId) => {
			if (!canCorner) return;
			setSelectedCorner(id);
			const gcode = getMovementGCode(id, homingSetting, homingFlag, pullOff);
			if (gcode.length) {
				controller.command("gcode", gcode);
			}
		},
		[canCorner, homingSetting, homingFlag, pullOff],
	);

	const cornerLabel =
		CORNERS.find((c) => c.id === selectedCorner)?.label ?? "Center";

	// ── Go To ──────────────────────────────────────────────────────────────
	const isInRotaryMode = workspaceMode === "ROTARY";
	const hasAAxisReported = Boolean(axes?.includes("A"));
	const aAxisIsAvailable =
		isInRotaryMode || (controllerType === "grblHAL" && hasAAxisReported);
	const yAxisIsAvailable = !isInRotaryMode;
	const mcsAvailable = hasHomed && homingEnabled;

	const [movementMode, setMovementMode] = useState<MovementMode>("abs");
	const [movementPos, setMovementPos] = useState({ x: 0, y: 0, z: 0, a: 0 });
	const [stepSize, setStepSize] = useState<(typeof STEP_SIZES)[number]>(1);

	useEffect(() => {
		if (movementMode === "inc") {
			setMovementPos({ x: 0, y: 0, z: 0, a: 0 });
		} else if (movementMode === "abs") {
			setMovementPos({
				x: Number(wpos?.x ?? 0),
				y: Number(wpos?.y ?? 0),
				z: Number(wpos?.z ?? 0),
				a: Number(wpos?.a ?? 0),
			});
		} else if (movementMode === "mcs") {
			setMovementPos({
				x: Number(mpos?.x ?? 0),
				y: Number(mpos?.y ?? 0),
				z: Number(mpos?.z ?? 0),
				a: Number(mpos?.a ?? 0),
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [movementMode]);

	useEffect(() => {
		if (movementMode === "mcs" && !mcsAvailable) {
			setMovementMode("abs");
		}
	}, [mcsAvailable, movementMode]);

	const adjustAxis = (axis: "x" | "y" | "z" | "a", delta: number) => {
		setMovementPos((prev) => ({
			...prev,
			[axis]: Number((prev[axis] + delta).toFixed(3)),
		}));
	};

	function goToLocation() {
		const code: string[] = [];
		const unitModal = units === METRIC_UNITS ? "G21" : "G20";

		const axisValues = [`X${movementPos.x}`];
		if (yAxisIsAvailable) axisValues.push(`Y${movementPos.y}`);
		if (aAxisIsAvailable) axisValues.push(`A${movementPos.a}`);

		if (movementMode === "mcs") {
			code.push(`G53 G0 ${axisValues.join(" ")}`);
		} else {
			const movementModal = movementMode === "inc" ? "G91" : "G90";
			code.push(movementModal, `G0 ${axisValues.join(" ")}`);
			code.push(movementModal, `G0 Z${movementPos.z}`);
		}

		controller.command("gcode:safe", code, unitModal);
	}

	const wcsColorClass = isWorkspace(activeWcs)
		? WORKSPACE_TEXT_COLORS[activeWcs]
		: WORKSPACE_TEXT_COLORS.G54;

	return (
		<div
			className={clsx(
				"flex-1 flex flex-col overflow-y-auto min-h-0 px-3 py-2 gap-3",
				mode === "expanded" ? "justify-start" : "justify-center",
			)}
		>
			{/* Quick row */}
			<div className="flex gap-2 shrink-0">
				<QuickActionButton
					label="Home All"
					Icon={Home}
					onClick={homeMachine}
					disabled={!canHome}
					variant="primary"
				/>
				<QuickActionButton
					label={`Zero ${activeWcs ?? "G54"}`}
					Icon={Crosshair}
					onClick={zeroAllAxes}
					disabled={!canAct}
					variant="secondary"
					textClassName={wcsColorClass}
				/>
				<QuickActionButton
					label="Park"
					Icon={CircleParking}
					onClick={goToParkLocation}
					disabled={!hasHomed}
					variant="neutral"
				/>
				<QuickActionButton
					label="Corners"
					Icon={LayoutGrid}
					onClick={() => setMode("expanded")}
					disabled={false}
					variant="navigate"
				/>
			</div>

			{mode === "expanded" && (
				<>
					{/* Corner Select */}
					<div className="section-label text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-content-muted">
						Corner Select
					</div>
					<div className="rounded-lg border border-gray-200 dark:border-outline bg-gray-50 dark:bg-surface-raised px-8 py-8">
						<div className="relative w-full h-[98px] rounded-md border border-dashed border-gray-300 dark:border-outline-subtle bg-white/40 dark:bg-surface-sunken/40">
							{CORNERS.map((corner) => (
								<HoldCorner
									key={corner.id}
									corner={corner}
									selected={selectedCorner === corner.id}
									disabled={!canCorner}
									onConfirm={handleConfirmCorner}
								/>
							))}
						</div>
						<div className="mt-1 flex items-center justify-center gap-2 text-center">
							<span className="font-mono text-xs text-blue-600 dark:text-blue-400">
								Target: {cornerLabel}
							</span>
							<span className="text-[10px] text-gray-400 dark:text-content-muted">
								· Hold to move
							</span>
						</div>
					</div>

					{/* Go To */}
					<div className="section-label text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-content-muted">
						Go To Position
					</div>
					<div className="flex rounded-lg border border-gray-200 dark:border-outline bg-gray-50 dark:bg-surface-raised p-1 gap-1">
						{(
							[
								{ key: "abs", label: "ABS" },
								{ key: "inc", label: "INC" },
								{ key: "mcs", label: "MACHINE" },
							] as { key: MovementMode; label: string }[]
						).map(({ key, label }) => {
							const isDisabled = key === "mcs" && !mcsAvailable;
							return (
								<button
									key={key}
									type="button"
									onClick={() => !isDisabled && setMovementMode(key)}
									disabled={isDisabled}
									className={clsx(
										"flex-1 py-2 rounded text-xs font-semibold uppercase tracking-wide transition-colors",
										movementMode === key
											? "bg-robin-100 dark:bg-robin-500/20 text-robin-700 dark:text-robin-400"
											: isDisabled
												? "text-gray-300 dark:text-content-disabled cursor-not-allowed"
												: "text-gray-500 dark:text-content-muted hover:bg-gray-100 dark:hover:bg-surface-hover",
									)}
								>
									{label}
								</button>
							);
						})}
					</div>

					<div className="flex justify-end gap-1 -mb-1">
						{STEP_SIZES.map((size) => (
							<button
								key={size}
								type="button"
								onClick={() => setStepSize(size)}
								className={clsx(
									"px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors",
									stepSize === size
										? "border-robin-500 bg-robin-50 dark:bg-robin-500/10 text-robin-600 dark:text-robin-400"
										: "border-gray-200 dark:border-outline text-gray-400 dark:text-content-muted",
								)}
							>
								{size}
							</button>
						))}
					</div>

					<div className="grid grid-cols-2 gap-2">
						{(
							[
								{ axis: "x" as const, label: "X", available: true },
								{ axis: "y" as const, label: "Y", available: yAxisIsAvailable },
								{ axis: "z" as const, label: "Z", available: true },
								{ axis: "a" as const, label: "A", available: aAxisIsAvailable },
							]
						)
							.filter((f) => f.available)
							.map(({ axis, label }) => (
								<div
									key={axis}
									className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-outline bg-gray-50 dark:bg-surface-raised px-2.5 py-2"
								>
									<span className="text-xs font-bold text-blue-600 dark:text-blue-400 w-4">
										{label}
									</span>
									<span className="flex-1 text-right font-mono text-sm text-gray-800 dark:text-content-primary tabular-nums">
										{movementPos[axis].toFixed(3)}
									</span>
									<div className="flex gap-1.5 shrink-0">
										<button
											type="button"
											onClick={() => adjustAxis(axis, -stepSize)}
											className="w-11 h-11 rounded-lg border border-gray-300 dark:border-outline text-gray-500 dark:text-content-secondary hover:bg-gray-100 dark:hover:bg-surface-hover active:bg-gray-200 dark:active:bg-surface-active text-lg font-bold"
										>
											–
										</button>
										<button
											type="button"
											onClick={() => adjustAxis(axis, stepSize)}
											className="w-11 h-11 rounded-lg border border-gray-300 dark:border-outline text-gray-500 dark:text-content-secondary hover:bg-gray-100 dark:hover:bg-surface-hover active:bg-gray-200 dark:active:bg-surface-active text-lg font-bold"
										>
											+
										</button>
									</div>
								</div>
							))}
					</div>

					<button
						type="button"
						onClick={goToLocation}
						disabled={!canAct}
						className={clsx(
							"w-full flex items-center justify-center gap-2 rounded-lg h-16 text-sm font-semibold uppercase tracking-wide transition-colors mb-2",
							canAct
								? "bg-robin-600 hover:bg-robin-500 active:bg-robin-700 text-white"
								: "bg-gray-200 dark:bg-surface-disabled text-gray-400 dark:text-content-disabled cursor-default",
						)}
					>
						<ArrowRight size={16} />
						Go to position
					</button>
				</>
			)}
		</div>
	);
}
