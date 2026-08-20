import { Tooltip } from "app/components/Tooltip";
import { GRBL_ACTIVE_STATE_IDLE } from "app/constants";
import { visualizerBridge } from "app/features/Visualizer/visualizerBridge";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import cx from "classnames";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { PiPuzzlePiece } from "react-icons/pi";

import { usePlugins } from "../hooks/usePlugins";
import type { PluginContribution, PluginRecord } from "../types";
import PluginPanel from "./PluginPanel";

// Geometry of the stacked floating toggles, matching the lightweight toggle in
// the Visualizer. Each overlay-plugin toggle stacks upward from the base button.
const BUTTON_SIZE_PX = 44; // h-11 / w-11
const CONTROL_GAP_PX = 12;

type Props = {
	// Bottom offset (px) of the lightweight toggle — overlay buttons stack above it.
	baseBottomPx: number;
	// Shared left offset (px) of the floating toggle column.
	leftPx: number;
};

const getOverlayContribution = (
	plugin: PluginRecord,
): PluginContribution | undefined =>
	plugin.contributions.find((c) => c.slot === "visualizer-overlay");

// Wraps the plugin iframe panel. On unmount (toggle off, plugin disabled, viewer
// teardown) it defensively disarms any pick the plugin left armed and clears its
// overlay markers so a closed plugin can't leave the viewer armed or littered.
const OverlayPanel = ({
	plugin,
	title,
	onClose,
}: {
	plugin: PluginRecord;
	title: string;
	onClose: () => void;
}) => {
	useEffect(() => {
		return () => {
			const handle = visualizerBridge.get();
			handle?.disarmPick();
			handle?.setOverlay([]);
		};
	}, []);

	return (
		<div className="absolute right-4 top-4 bottom-4 z-[10001] flex w-80 max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,_0,_0,_0.35)] dark:border-dark-lighter dark:bg-dark">
			<div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-dark-lighter">
				<span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
					{title}
				</span>
				<button
					type="button"
					aria-label="Close plugin"
					className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-dark-lighter dark:hover:text-gray-100"
					onClick={onClose}
				>
					<X aria-hidden="true" className="h-4 w-4" />
				</button>
			</div>
			<div className="min-h-0 flex-1 p-2">
				<PluginPanel plugin={plugin} />
			</div>
		</div>
	);
};

// Renders a floating toggle button per visualizer-overlay plugin. Toggling a
// button on mounts that plugin's sandboxed iframe as a floating panel over the
// canvas; toggling off unmounts it. The iframe talks to the host through the
// existing global plugin bridge (viewer:* requests / "viewer" topic), so no
// per-panel wiring is needed here.
const PluginVisualizerOverlayHost = ({ baseBottomPx, leftPx }: Props) => {
	const { visualizerOverlayPlugins } = usePlugins();
	// Only one overlay plugin may be open at a time. The viewer exposes a single
	// shared surface (one armed pick, one overlay marker list, one camera), so two
	// open plugins would fight over it and their panels would render on top of each
	// other. Opening a plugin closes any other; enforcing exclusivity here means
	// every current and future overlay plugin inherits it without extra wiring.
	const [openId, setOpenId] = useState<string | null>(null);

	// Whether the machine can currently accept a motion command. Toggles for
	// plugins that declare `requiresIdle` are greyed out and non-interactive
	// unless this holds (disconnected, cutting, hold, alarm, jog, etc. all gate).
	const isConnected = useTypedSelector((state) => state.connection.isConnected);
	const activeState = useTypedSelector(
		(state) => state.controller.state?.status?.activeState,
	);
	const machineReady = isConnected && activeState === GRBL_ACTIVE_STATE_IDLE;

	// Drop open state if the open plugin is no longer available (disabled/removed).
	useEffect(() => {
		setOpenId((prev) =>
			prev && visualizerOverlayPlugins.some((p) => p.id === prev)
				? prev
				: null,
		);
	}, [visualizerOverlayPlugins]);

	if (visualizerOverlayPlugins.length === 0) {
		return null;
	}

	// Toggle a plugin, closing any other that was open (mutual exclusion).
	const toggle = (id: string) => {
		setOpenId((prev) => (prev === id ? null : id));
	};

	return (
		<>
			{visualizerOverlayPlugins.map((plugin, index) => {
				const contribution = getOverlayContribution(plugin);
				const label = contribution?.label || plugin.name;
				const isOpen = openId === plugin.id;
				// Grey out and block a motion plugin's toggle when the machine can't
				// accept the command. Keep an already-open panel's toggle live so it
				// can still be closed (the panel itself surfaces the "not idle" state).
				const gated = !!contribution?.requiresIdle && !machineReady && !isOpen;
				// Stack each toggle one button-height above the previous.
				const bottom =
					baseBottomPx + (index + 1) * (BUTTON_SIZE_PX + CONTROL_GAP_PX);

				return (
					<div key={plugin.id}>
						<Tooltip
							content={gated ? `${label} — machine must be idle` : label}
							side="top"
						>
							<button
								type="button"
								style={{ left: leftPx, bottom }}
								className={cx(
									"absolute z-[10000] inline-flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border bg-dark-darker/70 shadow-[0_10px_30px_rgba(0,_0,_0,_0.25)] transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-dark-darker active:scale-[0.98] active:bg-dark-darker/85 mb-5",
									{
										"border-[rgba(14,_246,_174,_0.95)] text-[rgba(14,_246,_174,_0.95)] shadow-[0_0_0_1px_rgba(14,_246,_174,_0.35),0_10px_30px_rgba(0,_0,_0,_0.35)] hover:border-[rgba(14,_246,_174,_0.95)] hover:text-[rgba(14,_246,_174,_0.95)] hover:shadow-[0_0_0_1px_rgba(14,_246,_174,_0.45),0_12px_32px_rgba(0,_0,_0,_0.4)]":
											isOpen,
										"border-gray-400/40 text-gray-300 hover:border-gray-200/70 hover:text-gray-100 hover:shadow-[0_12px_32px_rgba(0,_0,_0,_0.35)]":
											!isOpen && !gated,
										"cursor-not-allowed border-gray-600/30 text-gray-500 opacity-40":
											gated,
									},
								)}
								aria-label={label}
								aria-pressed={isOpen}
								aria-disabled={gated}
								onClick={() => {
									if (!gated) {
										toggle(plugin.id);
									}
								}}
							>
								{contribution?.icon ? (
									<span
										aria-hidden="true"
										className="pointer-events-none text-lg leading-none"
									>
										{contribution.icon}
									</span>
								) : (
									<PiPuzzlePiece
										aria-hidden="true"
										className="pointer-events-none h-5 w-5 shrink-0"
									/>
								)}
							</button>
						</Tooltip>

						{isOpen && (
							<OverlayPanel
								plugin={plugin}
								title={label}
								onClose={() => toggle(plugin.id)}
							/>
						)}
					</div>
				);
			})}
		</>
	);
};

export default PluginVisualizerOverlayHost;
