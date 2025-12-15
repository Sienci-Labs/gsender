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
        <div className="h-full bg-gray-50 flex flex-col">
            <ProgressBar
                currentStep={currentStepIndex + 1}
                totalSteps={subWizard.steps.length}
                onExit={onExit}
            />

            <div className="flex flex-1 overflow-hidden">
                {showCompletion && CompletionComponent ? (
                    <div className="flex-1 p-12 overflow-y-auto">
                        <CompletionComponent />
                    </div>
                ) : (
                    <>
                        <div className="w-3/5 p-12 overflow-y-auto">
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                {currentStep.title}
                            </h1>

                            {subWizard.configVersion && (
                                <p className="text-gray-600 mb-8">
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
                        </div>

                        <div className="w-2/5 bg-gray-200 p-12 overflow-y-auto">
                            <SecondaryContentPanel
                                content={currentStep.secondaryContent || []}
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between">
                {showCompletion ? (
                    <>
                        <div></div>
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
        </div>
    );
}
