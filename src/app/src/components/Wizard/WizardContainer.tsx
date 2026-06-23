/** biome-ignore-all lint/a11y/useButtonType: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <> */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import ProgressBar from "./ProgressBar";
import { SecondaryContentPanel } from "./SecondaryContentPanel";
import type { SubWizard } from "./types/wizard";

interface Props {
	subWizard: SubWizard;
	onWizardExit: () => void;
}

export function WizardContainer({ subWizard, onWizardExit }: Props) {
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
	const [stepData, setStepData] = useState<Record<string, any>>({});
	const [showCompletion, setShowCompletion] = useState(false);

	const currentStep = subWizard.steps[currentStepIndex];
	const StepContextProvider = currentStep.contextProvider || Fragment;
	const { reset, onPrevious, onNext, getItemParams } = subWizard.context();
	const fillPrimaryContent = currentStep.fillPrimaryContent === true;
	const isFirstStep = currentStepIndex === 0;
	const isLastStep = currentStepIndex === subWizard.steps.length - 1;
	const isCurrentStepComplete = completedSteps.has(currentStepIndex);
	const isSingleStep = subWizard.steps.length === 1;

	useEffect(() => {
		if (!currentStep.autoComplete?.()) return;

		setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
		if (currentStepIndex < subWizard.steps.length - 1) {
			setCurrentStepIndex((prev) => prev + 1);
		}
	}, [currentStepIndex]);

	const handleNext = () => {
		if (!isLastStep && isCurrentStepComplete) {
			setCurrentStepIndex(currentStepIndex + 1);
			onNext?.();
		} else if (
			isLastStep &&
			isCurrentStepComplete &&
			subWizard.completionPage
		) {
			setShowCompletion(true);
		}
	};

	const handlePrevious = () => {
		if (!isFirstStep) {
			let prevIndex = currentStepIndex - 1;
			while (prevIndex > 0 && subWizard.steps[prevIndex].autoComplete?.()) {
				prevIndex--;
			}
			setCurrentStepIndex(prevIndex);
			onPrevious?.();
		}
	};

	const handleStepComplete = () => {
		const newCompletedSteps = new Set(completedSteps).add(currentStepIndex);
		setCompletedSteps(newCompletedSteps);
	};

	const handleStepUncomplete = () => {
		setCompletedSteps((prev) => {
			const newSet = new Set(prev);
			newSet.delete(currentStepIndex);
			return newSet;
		});
		setShowCompletion(false);
	};

	const handleDataChange = (data: Record<string, any>) => {
		setStepData((prev) => ({
			...prev,
			[currentStep.id]: data,
		}));
	};

	const onExit = () => {
		setCurrentStepIndex(0);
		setCompletedSteps(new Set());
		setStepData({});
		setShowCompletion(false);
		onWizardExit();
		reset?.();
	};

	const resetWizard = () => {
		setCurrentStepIndex(0);
		setCompletedSteps(new Set());
		setStepData({});
		setShowCompletion(false);
		reset?.();
	};

	const StepComponent = currentStep.component;
	const CompletionComponent = subWizard.completionPage;

	return (
		<div className="fixed-content-area min-h-0 bg-gray-50 dark:bg-slate-800 flex flex-col">
			{isSingleStep ? (
				<div className="bg-white dark:bg-dark-darker border-b border-gray-200 px-4 py-2 flex items-center justify-between">
					<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
						{currentStep.title}
					</span>
					<button
						onClick={onExit}
						className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						Exit
					</button>
				</div>
			) : (
				<ProgressBar
					currentStep={currentStepIndex + 1}
					totalSteps={subWizard.steps.length}
					onExit={onExit}
					isCompleted={showCompletion}
				/>
			)}

			<StepContextProvider>
				<div
					className={
						subWizard.secondaryContentLeft
							? "flex flex-row-reverse flex-1 overflow-hidden portrait:flex-col"
							: "flex flex-1 overflow-hidden portrait:flex-col-reverse"
					}
				>
					<div
						className={`portrait:w-full portrait:text-xl portrait:h-3/5 p-12 portrait:p-6 ${
							fillPrimaryContent
								? "flex flex-col min-h-0 overflow-hidden"
								: "overflow-y-auto"
						} ${showCompletion && CompletionComponent ? "w-full" : "w-3/5"}`}
					>
						{showCompletion && CompletionComponent ? (
							<CompletionComponent />
						) : (
							<>
								{!isSingleStep && (
									<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
										{currentStep.title}
									</h1>
								)}

								<div
									className={`${fillPrimaryContent ? "mt-0" : "mt-8"} ${
										fillPrimaryContent ? "flex-1 min-h-0 overflow-hidden" : ""
									}`}
								>
									<StepComponent
										onComplete={handleStepComplete}
										onUncomplete={handleStepUncomplete}
										data={stepData[currentStep.id]}
										onDataChange={handleDataChange}
									/>
								</div>
							</>
						)}
					</div>

					{showCompletion && CompletionComponent ? null : (
						<div className="w-2/5 portrait:h-2/5 portrait:w-full bg-gray-200 dark:bg-dark px-12 py-4 portrait:p-4 flex flex-col overflow-hidden">
							<SecondaryContentPanel
								content={
									showCompletion ? [] : currentStep.secondaryContent || []
								}
								getItemParams={getItemParams}
							/>
						</div>
					)}
				</div>
			</StepContextProvider>

			{!isSingleStep && (
				<div className="bg-white dark:bg-dark-darker border-t border-gray-200 dark:border-gray-800 px-8 py-4 flex items-center justify-between">
					{showCompletion ? (
						<div className="flex w-full flex-row justify-between">
							<button
								onClick={onExit}
								className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800"
							>
								Exit Wizard
							</button>
							<button
								onClick={resetWizard}
								className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors text-gray-900 bg-gray-200 hover:bg-gray-100"
							>
								Restart Wizard
							</button>
						</div>
					) : (
						<>
							<button
								onClick={handlePrevious}
								disabled={isFirstStep}
								className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${
									isFirstStep
										? "text-gray-400 cursor-not-allowed"
										: "text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700"
								}
              `}
							>
								<ChevronLeft size={20} />
								Previous
							</button>

							<button
								onClick={handleNext}
								disabled={!isCurrentStepComplete}
								className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${
									!isCurrentStepComplete
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-gray-900 text-white hover:bg-gray-800"
								}
              `}
							>
								Next
								<ChevronRight size={20} />
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
}
