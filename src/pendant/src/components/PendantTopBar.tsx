import ConnectionWidget from "./ConnectionWidget";
import { cancelJog } from "app/features/Jogging/utils/Jogging";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import type { RootState } from "app/store/redux";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ComponentType } from "react";
import { useLongPress } from "use-long-press";
import { Confirm } from "app/components/ConfirmationDialog/ConfirmationDialogLib.ts";
import { isElectron, quitApp } from "../electron-bridge";
import {
	Circle,
	CircleCheck,
	CircleOff,
	DoorClosed,
	House,
	Moon,
	Move,
	Pause,
	Play,
	TriangleAlert,
	Unplug,
	Wrench,
	FileSearch,
	LockOpen,
} from "lucide-react";
import {
	GRBL_ACTIVE_STATE_ALARM,
	GRBL_ACTIVE_STATE_CHECK,
	GRBL_ACTIVE_STATE_DOOR,
	GRBL_ACTIVE_STATE_HOLD,
	GRBL_ACTIVE_STATE_HOME,
	GRBL_ACTIVE_STATE_IDLE,
	GRBL_ACTIVE_STATE_JOG,
	GRBL_ACTIVE_STATE_RUN,
	GRBL_ACTIVE_STATE_SLEEP,
	GRBL_ACTIVE_STATE_TESTING,
	GRBL_ACTIVE_STATE_TOOL,
} from "app/constants";
import controller from "app/lib/controller";
import iconRound from "../assets/icon-round.png";

interface StateColors {
	border: string;
	background: string;
	iconBackground: string;
	iconColor: string;
	divider: string;
	color: string;
}

type BadgeConfig = {
	label: string;
	icon: ComponentType<{ className?: string }>;
	animation?: "pulse-run" | "pulse-alarm";
	dark: StateColors;
	light: StateColors;
};

function useIsDark() {
	const [isDark, setIsDark] = useState(() =>
		document.documentElement.classList.contains("dark"),
	);
	useEffect(() => {
		const obs = new MutationObserver(() =>
			setIsDark(document.documentElement.classList.contains("dark")),
		);
		obs.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => obs.disconnect();
	}, []);
	return isDark;
}

const DISC_COLORS = {
	// Neutral (disconnected / no-state) badge — resolves from the Workshop
	// semantic tokens in dark mode; light values preserved.
	dark: {
		border: "var(--outline-default)",
		background: "var(--surface-raised)",
		iconBackground: "var(--surface-elevated)",
		iconColor: "var(--content-muted)",
		divider: "var(--outline-subtle)",
		color: "var(--content-muted)",
	},
	light: {
		border: "#cbd5e1",
		background: "#f8fafc",
		iconBackground: "#94a3b8",
		iconColor: "#ffffff",
		divider: "#cbd5e1",
		color: "#94a3b8",
	},
};

const BADGE_DISCONNECTED: BadgeConfig = {
	label: "Disconnected",
	icon: Unplug,
	...DISC_COLORS,
};
const BADGE_DEFAULT: BadgeConfig = {
	label: "No State",
	icon: CircleOff,
	...DISC_COLORS,
};

const STATE_BADGES: Record<string, BadgeConfig> = {
	[GRBL_ACTIVE_STATE_IDLE]: {
		label: "Idle",
		icon: Circle,
		dark: {
			border: "rgba(107,114,128,0.40)",
			background: "rgba(107,114,128,0.08)",
			iconBackground: "rgba(107,114,128,0.22)",
			iconColor: "#ffffff",
			divider: "rgba(107,114,128,0.25)",
			color: "#6b7280",
		},
		light: {
			border: "#64748b",
			background: "#f8fafc",
			iconBackground: "#64748b",
			iconColor: "#ffffff",
			divider: "rgba(100,116,139,0.3)",
			color: "#64748b",
		},
	},
	[GRBL_ACTIVE_STATE_RUN]: {
		label: "Running",
		icon: Play,
		animation: "pulse-run",
		dark: {
			border: "rgba(5,150,105,0.50)",
			background: "rgba(5,150,105,0.08)",
			iconBackground: "rgba(5,150,105,0.25)",
			iconColor: "#ffffff",
			divider: "rgba(5,150,105,0.30)",
			color: "#059669",
		},
		light: {
			border: "#059669",
			background: "#ecfdf5",
			iconBackground: "#059669",
			iconColor: "#ffffff",
			divider: "rgba(5,150,105,0.3)",
			color: "#059669",
		},
	},
	[GRBL_ACTIVE_STATE_JOG]: {
		label: "Jogging",
		icon: Move,
		animation: "pulse-run",
		dark: {
			border: "rgba(5,150,105,0.50)",
			background: "rgba(5,150,105,0.08)",
			iconBackground: "rgba(5,150,105,0.25)",
			iconColor: "#ffffff",
			divider: "rgba(5,150,105,0.30)",
			color: "#059669",
		},
		light: {
			border: "#059669",
			background: "#ecfdf5",
			iconBackground: "#059669",
			iconColor: "#ffffff",
			divider: "rgba(5,150,105,0.3)",
			color: "#059669",
		},
	},
	[GRBL_ACTIVE_STATE_CHECK]: {
		label: "Check",
		icon: CircleCheck,
		dark: {
			border: "rgba(57,120,179,0.55)",
			background: "rgba(57,120,179,0.10)",
			iconBackground: "rgba(57,120,179,0.28)",
			iconColor: "#ffffff",
			divider: "rgba(57,120,179,0.30)",
			color: "#3978b3",
		},
		light: {
			border: "#3978b3",
			background: "#eff6ff",
			iconBackground: "#3978b3",
			iconColor: "#ffffff",
			divider: "rgba(57,120,179,0.3)",
			color: "#3978b3",
		},
	},
	[GRBL_ACTIVE_STATE_HOME]: {
		label: "Homing",
		icon: House,
		dark: {
			border: "rgba(57,120,179,0.55)",
			background: "rgba(57,120,179,0.10)",
			iconBackground: "rgba(57,120,179,0.28)",
			iconColor: "#ffffff",
			divider: "rgba(57,120,179,0.30)",
			color: "#3978b3",
		},
		light: {
			border: "#3978b3",
			background: "#eff6ff",
			iconBackground: "#3978b3",
			iconColor: "#ffffff",
			divider: "rgba(57,120,179,0.3)",
			color: "#3978b3",
		},
	},
	[GRBL_ACTIVE_STATE_HOLD]: {
		label: "Hold",
		icon: Pause,
		dark: {
			border: "rgba(187,106,12,0.55)",
			background: "rgba(161,98,7,0.10)",
			iconBackground: "rgba(187,106,12,0.28)",
			iconColor: "#ffffff",
			divider: "rgba(187,106,12,0.30)",
			color: "#bb6a0c",
		},
		light: {
			border: "#bb6a0c",
			background: "#fffbeb",
			iconBackground: "#bb6a0c",
			iconColor: "#ffffff",
			divider: "rgba(187,106,12,0.3)",
			color: "#bb6a0c",
		},
	},
	[GRBL_ACTIVE_STATE_DOOR]: {
		label: "Door",
		icon: DoorClosed,
		dark: {
			border: "rgba(187,106,12,0.55)",
			background: "rgba(161,98,7,0.10)",
			iconBackground: "rgba(187,106,12,0.28)",
			iconColor: "#ffffff",
			divider: "rgba(187,106,12,0.30)",
			color: "#bb6a0c",
		},
		light: {
			border: "#bb6a0c",
			background: "#fffbeb",
			iconBackground: "#bb6a0c",
			iconColor: "#ffffff",
			divider: "rgba(187,106,12,0.3)",
			color: "#bb6a0c",
		},
	},
	[GRBL_ACTIVE_STATE_ALARM]: {
		label: "Alarm",
		icon: TriangleAlert,
		animation: "pulse-alarm",
		dark: {
			border: "rgba(220,38,38,0.55)",
			background: "rgba(185,28,28,0.10)",
			iconBackground: "rgba(220,38,38,0.28)",
			iconColor: "#ffffff",
			divider: "rgba(220,38,38,0.30)",
			color: "#dc2626",
		},
		light: {
			border: "#dc2626",
			background: "#fff1f1",
			iconBackground: "#dc2626",
			iconColor: "#ffffff",
			divider: "rgba(220,38,38,0.3)",
			color: "#dc2626",
		},
	},
	[GRBL_ACTIVE_STATE_TOOL]: {
		label: "Tool Change",
		icon: Wrench,
		dark: {
			border: "rgba(124,58,237,0.50)",
			background: "rgba(124,58,237,0.10)",
			iconBackground: "rgba(124,58,237,0.28)",
			iconColor: "#ffffff",
			divider: "rgba(124,58,237,0.30)",
			color: "#7c3aed",
		},
		light: {
			border: "#7c3aed",
			background: "#f5f3ff",
			iconBackground: "#7c3aed",
			iconColor: "#ffffff",
			divider: "rgba(124,58,237,0.3)",
			color: "#7c3aed",
		},
	},
	[GRBL_ACTIVE_STATE_SLEEP]: {
		label: "Sleep",
		icon: Moon,
		dark: {
			border: "rgba(100,130,180,0.30)",
			background: "rgba(26,41,66,0.60)",
			iconBackground: "rgba(100,130,180,0.20)",
			iconColor: "rgba(148,174,213,0.85)",
			divider: "rgba(100,130,180,0.20)",
			color: "rgba(148,174,213,0.85)",
		},
		light: {
			border: "#93c5fd",
			background: "#f0f9ff",
			iconBackground: "#3b82f6",
			iconColor: "#ffffff",
			divider: "rgba(59,130,246,0.3)",
			color: "#3b82f6",
		},
	},
	[GRBL_ACTIVE_STATE_TESTING]: {
		label: "Testing",
		icon: FileSearch,
		dark: {
			border: "rgba(99,102,241,0.50)",
			background: "rgba(67,56,202,0.10)",
			iconBackground: "rgba(99,102,241,0.28)",
			iconColor: "#ffffff",
			divider: "rgba(99,102,241,0.30)",
			color: "#6366f1",
		},
		light: {
			border: "#4f46e5",
			background: "#eef2ff",
			iconBackground: "#4f46e5",
			iconColor: "#ffffff",
			divider: "rgba(79,70,229,0.3)",
			color: "#4f46e5",
		},
	},
};

const QUIT_HOLD_MS = 1000;
const QUIT_RING_RADIUS = 19;
const QUIT_RING_CIRCUMFERENCE = 2 * Math.PI * QUIT_RING_RADIUS;

function useLogoHoldToQuit() {
	const [progress, setProgress] = useState(0);
	const [isHolding, setIsHolding] = useState(false);
	const startTimeRef = useRef(0);
	const rafRef = useRef<number | null>(null);

	const stopProgressLoop = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
	}, []);

	useEffect(() => stopProgressLoop, [stopProgressLoop]);

	const startProgressLoop = useCallback(() => {
		const update = (now: number) => {
			const elapsed = now - startTimeRef.current;
			setProgress(Math.min(elapsed / QUIT_HOLD_MS, 1));
			rafRef.current = requestAnimationFrame(update);
		};
		rafRef.current = requestAnimationFrame(update);
	}, []);

	const bind = useLongPress(
		() => {
			setIsHolding(false);
			stopProgressLoop();
			setProgress(0);
			Confirm({
				title: "Quit gSender?",
				content: "Are you sure you want to quit gSender?",
				confirmLabel: "Quit",
				cancelLabel: "Cancel",
				onConfirm: () => quitApp(),
			});
		},
		{
			threshold: QUIT_HOLD_MS,
			cancelOnMovement: true,
			filterEvents: (event) => {
				if (!isElectron()) {
					return false;
				}
				if ("button" in event && typeof event.button === "number") {
					return event.button === 0;
				}
				return true;
			},
			onStart: () => {
				startTimeRef.current = performance.now();
				setProgress(0);
				setIsHolding(true);
				startProgressLoop();
			},
			onCancel: () => {
				stopProgressLoop();
				setProgress(0);
				setIsHolding(false);
			},
			onFinish: () => {
				stopProgressLoop();
			},
		},
	);

	return { bind, progress, isHolding };
}

export default function PendantTopBar() {
	const isDark = useIsDark();
	const { bind, progress, isHolding } = useLogoHoldToQuit();
	const isConnected = useTypedSelector(
		(s: RootState) => s.connection.isConnected,
	);
	const controllerType = useTypedSelector((s: RootState) => s.controller.type);
	const rawState = useTypedSelector(
		(s: RootState) => s.controller.state,
	) as any;
	const activeState: string = rawState?.status?.activeState ?? "";
	const alarmCode: string | number = rawState?.status?.alarmCode ?? 0;
	const badge = !isConnected
		? BADGE_DISCONNECTED
		: (STATE_BADGES[activeState] ?? BADGE_DEFAULT);
	const BadgeIcon = badge.icon;
	const c = isDark ? badge.dark : badge.light;
	const showAlarmCode =
		isConnected &&
		activeState === GRBL_ACTIVE_STATE_ALARM &&
		alarmCode !== 0 &&
		alarmCode !== "0" &&
		alarmCode !== "";
	const badgeLabel = showAlarmCode
		? `${badge.label} ${alarmCode}`
		: badge.label;
	const unlockActionable =
		isConnected &&
		(activeState === GRBL_ACTIVE_STATE_HOLD ||
			activeState === GRBL_ACTIVE_STATE_ALARM);
	const handleUnlock = () => {
		if (!isConnected) return;

		if (activeState === GRBL_ACTIVE_STATE_ALARM) {
			if (
				alarmCode === 1 ||
				alarmCode === 2 ||
				alarmCode === 10 ||
				alarmCode === 14 ||
				alarmCode === 17
			) {
				controller.command("reset:limit");
			} else if (alarmCode === 11 || alarmCode === "Homing") {
				controller.command("homing");
			} else {
				controller.command("unlock");
			}
			return;
		}

		if (activeState === GRBL_ACTIVE_STATE_HOLD) {
			controller.command("cyclestart");
		}
	};
	const handleEStop = () => {
		if (!isConnected) return;
		cancelJog(activeState, controllerType);
	};

	return (
		<header className="h-14 px-3 flex items-center gap-3 bg-gray-50 border-b border-gray-200 dark:bg-surface-base dark:border-outline shrink-0 select-none relative drag-region">
			{/* Logo — hold to quit */}
			<div
				className="relative flex items-center gap-2 shrink-0 no-drag touch-manipulation"
				onContextMenu={(event) => event.preventDefault()}
				{...bind()}
			>
				<img src={iconRound} alt="gSender" className="w-9 h-9" />
				{isHolding && (
					<svg
						width={44}
						height={44}
						viewBox="0 0 44 44"
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -rotate-90"
						aria-hidden
					>
						<circle
							cx={22}
							cy={22}
							r={QUIT_RING_RADIUS}
							fill="none"
							stroke="rgba(220,38,38,0.85)"
							strokeWidth={3}
							strokeLinecap="round"
							strokeDasharray={QUIT_RING_CIRCUMFERENCE}
							strokeDashoffset={
								QUIT_RING_CIRCUMFERENCE * (1 - Math.min(Math.max(progress, 0), 1))
							}
						/>
					</svg>
				)}
			</div>

			{/* Touch-forward connection widget */}
			<div className="shrink-0 no-drag">
				<ConnectionWidget />
			</div>

			{/* State badge — absolutely centred so Connection resizing doesn't shift it */}
			<div
				className={[
					"absolute left-1/2 -translate-x-1/2 pointer-events-none",
					badge.animation === "pulse-run" ? "badge-animate-run" : "",
					badge.animation === "pulse-alarm" ? "badge-animate-alarm" : "",
				].join(" ")}
				style={{
					width: "180px",
					height: "40px",
					borderRadius: "8px",
					overflow: "hidden",
					display: "flex",
					alignItems: "stretch",
					border: `1px solid ${c.border}`,
					background: c.background,
					color: c.color,
					fontSize: "14px",
					fontWeight: 500,
					flexShrink: 0,
				}}
			>
				<div
					style={{
						width: "40px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: c.iconBackground,
						color: c.iconColor,
						flexShrink: 0,
					}}
				>
					<BadgeIcon size={18} aria-hidden />
				</div>
				<div style={{ width: "1px", background: c.divider, flexShrink: 0 }} />
				<div
					style={{
						flex: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "0 8px",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{badgeLabel}
				</div>
			</div>

			{/* Spacer */}
			<div className="flex-1 h-full" />

			{/* Unlock + E-STOP */}
			<button
				onClick={handleUnlock}
				disabled={!unlockActionable}
				className={`w-[90px] flex items-center justify-center gap-2 font-bold px-3 py-2 rounded-lg text-sm transition-colors no-drag ${
					unlockActionable
						? alarmCode === 11 || alarmCode === "Homing"
							? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white unlock-attention-home"
							: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white unlock-attention"
						: "bg-gray-300 text-gray-600 dark:bg-surface-disabled dark:text-content-disabled"
				}`}
			>
				{alarmCode === 11 || alarmCode === "Homing" ? (
					<House className="w-4 h-4" />
				) : (
					<LockOpen className="w-4 h-4" />
				)}
				{alarmCode === 11 || alarmCode === "Homing" ? "Home" : "Unlock"}
			</button>
			<button
				type="button"
				onClick={handleEStop}
				disabled={!isConnected}
				className={`flex items-center gap-2 font-bold px-4 py-2 rounded-lg text-sm transition-colors no-drag ${isConnected ? "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white" : "bg-gray-300 text-gray-600 dark:bg-surface-disabled dark:text-content-disabled"}`}
			>
				<span>⊗</span> E-STOP
			</button>
		</header>
	);
}
