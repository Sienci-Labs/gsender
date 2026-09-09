import api from "app/api";
import { ScrollArea } from "app/components/shadcn/ScrollArea";
import { Switch } from "app/components/shadcn/Switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "app/components/shadcn/Tooltip";
import { JOB_STATUS } from "app/constants";
import GcodeStepper from "app/features/GcodeStepper";
import type { Job } from "app/features/Stats/utils/StatContext";
import { useTypedSelector } from "app/hooks/useTypedSelector";
import { convertMillisecondsToTimeStamp } from "app/lib/datetime";
import cx from "classnames";
import isElectron from "is-electron";
import { Footprints, Pencil } from "lucide-react";
import pubsub from "pubsub-js";
import { useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";
import { LiaFileUploadSolid } from "react-icons/lia";
import { LuFileCode2 } from "react-icons/lu";
import { MdInfoOutline } from "react-icons/md";
import type { RecentFile } from "../definitions";
import { getRecentFiles } from "../utils/recentfiles";
import Info from "./Info";
import LoadingAnimation from "./LoadingAnimation";
import Size from "./Size";

// The editor and step-through buttons are the two ways into the loaded file, so
// they share one look. Idle/active colours are kept out of the base string
// because Tailwind runs with `important: true` — two competing `border-*`
// classes would be resolved by stylesheet order, not by which one is listed
// last here.
const filePanelButtonClass =
	"flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border bg-white hover:bg-gray-100 dark:bg-surface-raised dark:hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const filePanelButtonIdleClass =
	"border-gray-300 text-gray-600 dark:border-outline dark:text-content-secondary";
const filePanelButtonActiveClass =
	"border-robin-500 text-robin-500 dark:border-robin-400 dark:text-robin-400";

interface Props {
	handleRecentFileUpload: (file: RecentFile, isRecentFile?: boolean) => void;
}

const FileInformation: React.FC<Props> = ({ handleRecentFileUpload }) => {
	const { name, size, total, path, fileLoaded, fileProcessing } =
		useTypedSelector((state) => state.file);

	const [toggleInfo, setToggleInfo] = useState(false);
	const [showEditor, setShowEditor] = useState(false);
	const [showStepper, setShowStepper] = useState(false);
	const [recentFiles, setRecentFiles] = useState<RecentFile[]>(
		getRecentFiles(),
	);
	const [lastJob, setLastJob] = useState<Job>(null);

	const fetchJobs = async () => {
		const jobStatRes = await api.jobStats.fetch();
		const { jobs = [] } = jobStatRes.data;
		setLastJob(jobs[jobs.length - 1]);
	};

	useEffect(() => {
		setRecentFiles(getRecentFiles());
		fetchJobs();

		const tokens = [
			pubsub.subscribe(
				"recent-files-updated",
				(_: string, files: RecentFile[]) => {
					setRecentFiles(files.slice());
				},
			),
			pubsub.subscribe("lastJob", (_: string, job: Job) => {
				setLastJob(job);
			}),
			pubsub.subscribe(
				"gcode-editor:toggle",
				(_: string, isVisible: boolean) => {
					setShowEditor(isVisible);
					// Handled here rather than in the switch so every path that opens
					// the editor closes the stepper, not just this widget's toggle.
					if (isVisible) {
						setShowStepper(false);
					}
				},
			),
			pubsub.subscribe("outline:start", () => {
				setShowEditor(false);
			}),
			pubsub.subscribe("macro:run", () => {
				setShowEditor(false);
			}),
		];
		return () => {
			tokens.forEach((token) => {
				pubsub.unsubscribe(token);
			});
		};
	}, []);

	useEffect(() => {
		pubsub.publish("gcode-editor:toggle", showEditor);
	}, [showEditor]);

	useEffect(() => {
		if (!fileLoaded && showEditor) {
			setShowEditor(false);
		}
	}, [fileLoaded, showEditor]);

	useEffect(() => {
		if (!fileLoaded && showStepper) {
			setShowStepper(false);
		}
	}, [fileLoaded, showStepper]);

	// The editor and the stepper are alternative full-screen views of the same
	// file and overlap on screen, so only one is shown at a time. Closing the
	// stepper doesn't bring the editor back.
	const handleStepperOpenChange = (open: boolean) => {
		setShowStepper(open);
		if (open) {
			setShowEditor(false);
		}
	};

	if (fileProcessing) {
		return <LoadingAnimation />;
	}

	if (!fileLoaded) {
		return (
			<div
				className={cx("mt-3 h-full", {
					"grid grid-cols-[3fr_2fr] gap-8 portrait:flex": isElectron(),
					"flex justify-center": !isElectron(),
				})}
			>
				{isElectron() && (
					<div className="flex flex-col gap-2 max-xl:gap-1 portrait:w-3/4">
						<span className="ml-6 dark:text-content-primary">Recent Files</span>
						<ScrollArea className="ml-2 px-2 h-28 max-xl:h-[6.5rem] portrait:mb-5 bg-white dark:bg-surface-raised rounded-xl border-2 dark:border-outline">
							<div className="grid divide-y items-center mr-2">
								{recentFiles.map(
									(file, index) =>
										index < 8 && (
											<div
												className="grid grid-cols-[30px_3fr] items-center gap-1 cursor-pointer py-2"
												role="button"
												tabIndex={0}
												aria-label={`Load recent file ${file.fileName}`}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														handleRecentFileUpload(file, true);
													}
												}}
												onClick={() =>
													handleRecentFileUpload(
														{
															fileName: file.fileName,
															fileSize: file.fileSize,
															filePath: file.filePath,
															timeUploaded: file.timeUploaded,
														},
														true,
													)
												}
											>
												<div className="text-2xl float-right rounded-r dark:text-content-primary">
													<LiaFileUploadSolid />
												</div>
												<div className="grid items-start">
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<span className="block text-ellipsis text-nowrap overflow-hidden whitespace-nowrap dark:text-content-primary">
																	{file.fileName}
																</span>
															</TooltipTrigger>
															<TooltipContent>{file.fileName}</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
											</div>
										),
								)}
							</div>
						</ScrollArea>
					</div>
				)}
				<div
					className={cx("flex flex-col gap-4 text-sm justify-between", {
						"max-w-60": !isElectron(),
					})}
				>
					{lastJob && (
						<>
							<span className="text-base text-gray-900 dark:text-content-secondary">
								Last Job
							</span>
							<div className="grid grid-rows-3 gap-4 max-xl:gap-2 -ml-[2px] text-gray-500 font-bold">
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="grid grid-cols-[20px_5fr] items-start gap-2">
												<LuFileCode2 className="text-lg" />
												<div className="block text-ellipsis text-nowrap overflow-hidden whitespace-nowrap">
													<span className="font-bold">{lastJob.file}</span>
												</div>
											</div>
										</TooltipTrigger>
										<TooltipContent>{lastJob.file}</TooltipContent>
									</Tooltip>
								</TooltipProvider>

								<div className="flex flex-row gap-2">
									<MdInfoOutline className="text-xl -ml-[1px]" />
									<span
										className={cx({
											"text-green-500":
												lastJob.jobStatus === JOB_STATUS.COMPLETE,
											"text-red-500": lastJob.jobStatus === JOB_STATUS.STOPPED,
										})}
									>
										{lastJob.jobStatus}
									</span>
								</div>
								<div className="flex flex-row gap-2">
									<FiClock className="text-lg" />
									<span>
										{convertMillisecondsToTimeStamp(lastJob.duration)}
									</span>
								</div>
							</div>
							<div className="h-1/2"></div>
						</>
					)}
				</div>
			</div>
		);
	}

	const formatFileSize = (size: number): string => {
		if (size < 1024) {
			return `${size} Bytes`;
		}

		if (size < 1024 * 1024) {
			return `${(size / 1024).toFixed(0)} KB`;
		}

		return `${(size / (1024 * 1024)).toFixed(0)} MB`;
	};

	const splitFileNameAndExtension = (name: string = "") => {
		if (!name) return ["", ""];

		if (name.indexOf(".") > 0) {
			return name.split(".");
		}

		return [name, ""];
	};

	const fileSize = formatFileSize(size);
	const ToggleOutput = toggleInfo ? Info : Size;

	const [fileName, extension] = splitFileNameAndExtension(name);

	return (
		<div className="flex flex-col justify-center items-center text-sm max-w-full text-gray-900 dark:text-content-secondary h-full w-full">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<div className="max-w-full flex flex-row">
							<h2 className="inline-block text-lg font-bold text-ellipsis overflow-hidden whitespace-nowrap">
								{fileName}
							</h2>
							<h2 className="inline-block text-lg font-bold">.{extension}</h2>
						</div>
					</TooltipTrigger>
					<TooltipContent>{name}</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<div className="text-gray-500 flex gap-1 text-xs">
				<span>{fileSize}</span>

				<span>({total} lines)</span>
			</div>

			{path && (
				<div className="text-gray-500 text-xs max-w-full flex flex-row">
					<span className="inline-block text-ellipsis overflow-hidden whitespace-nowrap">
						{path}
					</span>
				</div>
			)}

			<div className="flex gap-4 justify-center items-center w-full">
				<div className="flex flex-col items-center flex-shrink-0">
					<span className="text-gray-500">Info</span>
					<Switch
						checked={toggleInfo}
						onChange={() => setToggleInfo((prev) => !prev)}
						position="vertical"
						data-testid="toggle-info"
						aria-label="Toggle file info or size view"
					/>
					<span className="text-gray-500">Size</span>
				</div>

				<ToggleOutput />

				{fileLoaded && (
					<TooltipProvider>
						{/* Side by side while there's room; stacked once the widget gets
						    narrow, where the row would otherwise squeeze the size readout. */}
						<div className="flex flex-row gap-2 max-lg:flex-col portrait:flex-col">
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={() => setShowEditor((prev) => !prev)}
										data-testid="show-gcode-editor"
										aria-label="Toggle G-code editor"
										aria-pressed={showEditor}
										className={cx(
											filePanelButtonClass,
											showEditor
												? filePanelButtonActiveClass
												: filePanelButtonIdleClass,
										)}
									>
										<Pencil className="h-5 w-5" />
									</button>
								</TooltipTrigger>
								<TooltipContent>G-code Editor</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={() => handleStepperOpenChange(true)}
										data-testid="open-gcode-stepper"
										aria-label="Open G-code step through"
										className={cx(
											filePanelButtonClass,
											filePanelButtonIdleClass,
										)}
									>
										<Footprints className="h-5 w-5" />
									</button>
								</TooltipTrigger>
								<TooltipContent>G-code Step Through</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
				)}
			</div>

			<GcodeStepper open={showStepper} onOpenChange={handleStepperOpenChange} />
		</div>
	);
};

export default FileInformation;
