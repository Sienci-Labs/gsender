import { Button } from "app/components/Button";
import { ControlledInput } from "app/components/ControlledInput";
import { Button as ShadButton } from "app/components/shadcn/Button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "app/components/shadcn/Dialog";
import Tooltip from "app/components/Tooltip";
import { FaPlay } from "react-icons/fa";
import { toast } from "app/lib/toaster";
import { useWidgetState } from "app/hooks/useWidgetState";
import pubsub from "pubsub-js";
import { useWorkspaceState } from "app/hooks/useWorkspaceState";
import { convertToImperial } from "app/lib/units";
import { usePostHog } from "@posthog/react";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import controller from "app/lib/controller";
import { IMPERIAL_UNITS, METRIC_UNITS } from "app/constants";
import { updateJobOverrides } from "app/store/redux/slices/visualizer.slice";
import { store as reduxStore } from "app/store/redux";
import { useEffect, useState } from "react";
import { MdFormatListNumbered } from "react-icons/md";
import cx from "classnames";

type StartFromLineProps = {
	disabled: boolean;
	lastLine: number;
	atcValidator?: () => [
		boolean,
		{
			type: string;
			title: string;
			body: React.ReactNode;
		},
	];
};

const StartFromLine = ({
	disabled,
	lastLine,
	atcValidator,
}: StartFromLineProps) => {
	const zMax = useTypedSelector((state) => state.file.bbox.max.z);
	const { units, safeRetractHeight } = useWorkspaceState();
	const { delay = 0 } = useWidgetState("spindle");
	const lineTotal = useTypedSelector((state) => state.file.total);
	const posthog = usePostHog();

	const calculateSafeHeight = () => {
		if (safeRetractHeight === 0) {
			return units === METRIC_UNITS ? 10 : 0.4;
		} else {
			return units === METRIC_UNITS
				? safeRetractHeight
				: convertToImperial(safeRetractHeight);
		}
	};

	const [state, setState] = useState({
		showModal: false,
		needsRecovery: false,
		value: lastLine,
		startFromLine: lastLine - 10 >= 0 ? lastLine - 10 : 0,
		waitForHoming: false,
		useDefaultSafe: safeRetractHeight === 0,
		safeHeight: calculateSafeHeight(),
		defaultSafeHeight: units === METRIC_UNITS ? 10 : 0.4,
	});

	// update units for safe height
	useEffect(() => {
		setState({
			...state,
			safeHeight: calculateSafeHeight(),
			defaultSafeHeight: units === METRIC_UNITS ? 10 : 0.4,
		});
	}, [units, safeRetractHeight]);

	const handleStartFromLine = () => {
		const { safeHeight, startFromLine } = state;

		setState((prev: any) => ({
			...prev,
			showModal: false,
			needsRecovery: false,
		}));

		const newSafeHeight =
			units === IMPERIAL_UNITS ? safeHeight * 25.4 : safeHeight;
		controller.command(
			"gcode:start",
			startFromLine,
			zMax,
			newSafeHeight,
			delay,
		);
		reduxStore.dispatch(
			updateJobOverrides({ isChecked: true, toggleStatus: "overrides" }),
		);
		toast.info("Running Start From Specific Line Command", {
			position: "bottom-right",
		});
		posthog.capture("start_from_line_run", {
			feature: "JobControl",
			line: startFromLine,
			safe_height: newSafeHeight,
			z_max: zMax,
			delay,
		});
	};

	return (
		<>
			<ShadButton
				disabled={disabled}
				className={cx("rounded-[0.2rem] border-solid border-2 text-base px-2", {
					"border-blue-400 bg-white dark:bg-dark dark:text-gray-300 [box-shadow:_2px_2px_5px_0px_var(--tw-shadow-color)] shadow-gray-400":
						!disabled,
					"border-gray-500 bg-gray-400 dark:bg-dark dark:text-gray-400":
						disabled,
				})}
				onClick={() => {
					const [invalidATC, payload] = atcValidator();
					if (invalidATC) {
						if (payload.type === "error") {
							pubsub.publish("atc_validator", payload);
							return;
						}
					}

					setState((prev: any) => ({ ...prev, showModal: true }));
				}}
			>
				<MdFormatListNumbered className="text-2xl mr-1" /> Start From
			</ShadButton>
			<Dialog
				open={state.showModal}
				onOpenChange={() => {
					setState((prev: any) => ({ ...prev, showModal: false }));
				}}
			>
				<DialogContent className="bg-white">
					<DialogHeader>
						<DialogTitle>
							{state.needsRecovery
								? "Recovery: Start From Line"
								: "Start From Line"}
						</DialogTitle>
					</DialogHeader>
					<div className="">
						<div className="mb-4">
							<p className="mb-2">
								Recover a job after power loss, mechanical malfunction,
								disconnection, or other failure.
							</p>
							<p className="mb-0 text-black dark:text-white">
								Your job of <b>{lineTotal}</b> lines was last stopped around
								line: <b>{lastLine}</b>.
							</p>
							{state.value > 0 && (
								<p>
									For best success, we usually recommend resuming about{" "}
									<strong>10 lines</strong> earlier:{" "}
									<strong>line {lastLine - 10 >= 0 ? lastLine - 10 : 0}</strong>
								</p>
							)}
						</div>
						<div className="mb-4">
							<div className="grid grid-cols-4 gap-2 items-center">
								<label htmlFor="resumeJobLine">Resume job at line:</label>
								<ControlledInput
									id="resumeJobLine"
									type="number"
									value={state.startFromLine}
									onChange={(e) => {
										const newValue = Number(e.target.value);
										if (newValue >= 0 /* && newValue <= lineTotal */) {
											setState((prev: any) => ({
												...prev,
												startFromLine: Math.ceil(newValue),
											}));
										}
									}}
									min={1}
									max={lineTotal}
								/>
							</div>
						</div>
						<div className="mb-4">
							<div className="grid grid-cols-4 gap-2 items-center">
								{/*
                                    tooltip cannot be nested any deeper, or the controlled input
                                    wont fire onBlur when you click off of it
                                */}
								<Tooltip content={`Default Value: ${state.defaultSafeHeight}`}>
									<>
										<label htmlFor="safeHeight">With Safe Height:</label>
										<ControlledInput
											id="safeHeight"
											type="number"
											value={state.safeHeight}
											onChange={(e) => {
												setState((prev: any) => ({
													...prev,
													safeHeight: Number(e.target.value),
												}));
											}}
											suffix={units}
										/>
									</>
								</Tooltip>
								<span className="text-sm col-span-2">
									(amount above the max height of the file)
								</span>
							</div>
						</div>
						<div className="mb-4">
							<p className="text-[#E2943B]">
								Calculates all your CNC movements, attributes, and gSender
								automations to pick up right where you left off.
							</p>
						</div>
						<div className="flex justify-center">
							<Button
								onClick={handleStartFromLine}
								variant={"primary"}
								// disabled={!isConnected}
								className="flex flex-row p-3 items-center gap-2 portrait:px-6 portrait:text-xl"
							>
								<FaPlay className="ml-2" />
								<span>Start from Line</span>
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default StartFromLine;
