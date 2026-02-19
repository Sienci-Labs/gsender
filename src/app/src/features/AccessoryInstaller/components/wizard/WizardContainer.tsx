import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SubWizard } from '../../types/wizard';
import { ProgressBar } from './ProgressBar';
import { SecondaryContentPanel } from './SecondaryContentPanel';

interface WizardContainerProps {
    subWizard: SubWizard;
    onExit: () => void;
}

export function WizardContainer({ subWizard, onExit }: WizardContainerProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(
        new Set(),
    );
    const [stepData, setStepData] = useState<Record<string, any>>({});
    const [showCompletion, setShowCompletion] = useState(false);

    const currentStep = subWizard.steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === subWizard.steps.length - 1;
    const isCurrentStepComplete = completedSteps.has(currentStepIndex);
    const isSingleStep = subWizard.steps.length === 1;

    useEffect(() => {
        setCurrentStepIndex(0);
        setCompletedSteps(new Set());
        setStepData({});
        setShowCompletion(false);
    }, [subWizard.id]);

    const handleNext = () => {
        if (!isLastStep && isCurrentStepComplete) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const handleStepComplete = () => {
        const newCompletedSteps = new Set(completedSteps).add(currentStepIndex);
        setCompletedSteps(newCompletedSteps);

        if (
            isLastStep &&
            newCompletedSteps.size === subWizard.steps.length &&
            subWizard.completionPage
        ) {
            setShowCompletion(true);
        }
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

    const StepComponent = currentStep.component;
    const CompletionComponent = subWizard.completionPage;

    return (
        <div className="h-full bg-gray-50 dark:bg-slate-800 flex flex-col">
            {isSingleStep ? (
                <div className="bg-white dark:bg-dark-darker border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {currentStep.title}
                    </span>
                    <button
                        onClick={onExit}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors"
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

            <div className="flex flex-1 overflow-hidden portrait:flex-col-reverse">
                <div className="w-3/5 portrait:w-full portrait:text-xl portrait:h-3/5 p-12 overflow-y-auto">
                    {showCompletion && CompletionComponent ? (
                        <CompletionComponent />
                    ) : (
                        <>
                            {!isSingleStep && (
                                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                    {currentStep.title}
                                </h1>
                            )}

                            {subWizard.configVersion && (
                                <p className="text-gray-600 dark:text-gray-400 mb-8">
                                    Configuration File Version:{' '}
                                    {subWizard.configVersion}
                                </p>
                            )}

                            <div className="mt-8">
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

                <div className="w-2/5 portrait:h-2/5 portrait:w-full bg-gray-200 dark:bg-dark p-12 overflow-y-auto">
                    <SecondaryContentPanel
                        content={
                            showCompletion
                                ? []
                                : currentStep.secondaryContent || []
                        }
                    />
                </div>
            </div>

            {!isSingleStep && (
                <div className="bg-white dark:bg-dark-darker border-t border-gray-200 dark:border-gray-800 px-8 py-4 flex items-center justify-between">
                    {showCompletion ? (
                        <>
                            <button
                                onClick={onExit}
                                className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800"
                            >
                                Exit Wizard
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handlePrevious}
                                disabled={isFirstStep}
                                className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${
                    isFirstStep
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                }
              `}
                            >
                                <ChevronLeft size={20} />
                                Previous
                            </button>

                            <button
                                onClick={handleNext}
                                disabled={!isCurrentStepComplete || isLastStep}
                                className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
                ${
                    !isCurrentStepComplete || isLastStep
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
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
