import { Button } from "app/components/Button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "app/components/shadcn/AlertDialog";
import { WCSInput } from "app/features/DRO/component/WCSInput.tsx";
import {
	type Axis,
	handleManualOffset,
	homeAxis,
} from "app/features/DRO/utils/DRO.ts";
import { useWorkspaceState } from "app/hooks/useWorkspaceState.ts";
import { usePostHog } from "@posthog/react";
import { gotoZero, zeroWCS } from "../utils/DRO.ts";

interface AxisRowProps {
	label: string;
	axis: Axis;
	mpos: string | number;
	wpos: string | number;
	disabled: boolean;
	homingMode: boolean;
	disablePositionUpdate?: boolean;
	disableGotoZero?: boolean;
}

export function AxisRow({
	label,
	axis,
	mpos,
	wpos,
	disabled,
	homingMode,
	disablePositionUpdate,
	disableGotoZero,
}: AxisRowProps) {
	const { shouldWarnZero } = useWorkspaceState();
	const posthog = usePostHog();

	return (
		<div className="border border-gray-200 dark:border-gray-700 rounded-md w-full flex flex-row items-stretch justify-between flex-1 max-xl:scale-95">
			{homingMode || !shouldWarnZero ? (
				<Button
					onClick={() => {
						if (homingMode) {
							homeAxis(axis);
							posthog.capture("axis_homed", {
								axis,
								feature: "DRO",
							});
						} else {
							zeroWCS(axis, 0);
							posthog.capture("axis_zeroed", {
								axis,
								feature: "DRO",
							});
						}
					}}
					size="responsive"
					disabled={disabled}
					variant={homingMode ? "alt" : "secondary"}
					tooltip={{
						content: `${homingMode ? "Home" : "Zero"} your ${label}-axis`,
						side: "left",
					}}
					aria-label={
						homingMode
							? `Home ${label} axis: Move to physical machine limit`
							: `Zero ${label} axis: Set current position as work zero`
					}
				>
					<span className="font-bold font-mono text-xl transition-all transition-duration-300">
						{`${homingMode ? "H" : ""}${label}${homingMode ? "" : "0"}`}
					</span>
				</Button>
			) : (
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							disabled={disabled}
							variant="secondary"
							size="sm"
							aria-label={`Zero ${label} axis`}
						>
							<span className="font-bold font-mono text-xl transition-all transition-duration-300">
								{`${label}0`}
							</span>
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent className="bg-white">
						<AlertDialogHeader>
							<AlertDialogTitle>Zero {label} Axis</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to zero the {label} axis?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									zeroWCS(label, 0);
									posthog.capture("axis_zeroed", {
										axis: label,
										feature: "DRO",
									});
								}}
							>
								Continue
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}

			<WCSInput
				disabled={disabled}
				value={disablePositionUpdate ? undefined : (wpos as string)}
				axis={axis}
				movementHandler={handleManualOffset}
			/>

			<span
				className="font-mono flex items-center text-sm text-gray-400 w-[9ch] text-center"
				data-testid={`mpos-${axis}`}
			>
				{disablePositionUpdate ? "0.00" : mpos}
			</span>

			<Button
				disabled={disabled || disableGotoZero}
				onClick={() => {
					gotoZero(axis);
					posthog.capture("go_to_axis_zero", {
						axis,
						feature: "DRO",
					});
				}}
				variant="alt"
				size="responsive"
				tooltip={{
					content: `Go to ${label}-axis zero`,
				}}
				aria-label={`Go to ${label} axis zero: Move axis to its current work zero position`}
			>
				<span className="text-lg font-mono">{label}</span>
			</Button>
		</div>
	);
}
