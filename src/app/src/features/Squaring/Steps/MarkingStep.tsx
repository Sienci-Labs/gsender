import { LuArrowRight } from 'react-icons/lu';
import Button from 'app/components/Button';
import { Input } from 'app/components/shadcn/Input';
import { useSquaring } from '../context/SquaringContext';
import TriangleDiagram from '../components/TriangleDiagram';

const MarkingStep = () => {
    const {
        mainSteps,
        currentMainStep,
        currentSubStep,
        completeStep,
        updateStepValue,
        jogMachine,
    } = useSquaring();

    const currentMainStepData = mainSteps[currentMainStep];
    const currentSubStepData = currentMainStepData.subSteps[currentSubStep];

    const handleStepComplete = (buttonLabel: string) => {
        completeStep(buttonLabel);
    };

    const handleJog = (buttonLabel: string, value: number, axis: string) => {
        jogMachine(axis, value);
        handleStepComplete(buttonLabel);
    };

    return (
        <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold dark:text-white">
                        Instructions
                    </h3>
                    <p className="text-gray-600 dark:text-white">
                        {currentSubStepData.description}
                    </p>
                </div>

                <div className="space-y-6">
                    {currentMainStepData.subSteps.map((step, index) => {
                        const isCurrentStep = index === currentSubStep;
                        const isPastStep = index < currentSubStep;
                        const isMovementStep =
                            step.buttonLabel.includes('Move');

                        return (
                            <div
                                key={step.buttonLabel}
                                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                    isCurrentStep
                                        ? 'bg-green-50 border border-green-200'
                                        : isPastStep
                                          ? 'bg-blue-50 border border-blue-200'
                                          : 'bg-gray-50 border border-gray-200 dark:bg-dark dark:border-gray-700'
                                }`}
                            >
                                <LuArrowRight
                                    className={`min-w-8 min-h-8 p-[4px] text-white rounded-full ${
                                        isCurrentStep
                                            ? 'bg-green-500 animate-pulse'
                                            : isPastStep
                                              ? 'bg-blue-500'
                                              : 'bg-gray-300 dark:bg-dark-lighter dark:text-white'
                                    }`}
                                />
                                <div className="flex flex-col gap-2 flex-1">
                                    <div className="flex items-center gap-4">
                                        <Button
                                            disabled={
                                                !isCurrentStep || step.completed
                                            }
                                            onClick={() => {
                                                if (
                                                    isMovementStep &&
                                                    step.value !== undefined
                                                ) {
                                                    const axis =
                                                        step.buttonLabel.includes(
                                                            'X',
                                                        )
                                                            ? 'X'
                                                            : 'Y';
                                                    handleJog(
                                                        step.buttonLabel,
                                                        step.value,
                                                        axis,
                                                    );
                                                } else {
                                                    handleStepComplete(
                                                        step.buttonLabel,
                                                    );
                                                }
                                            }}
                                            className={`${
                                                isCurrentStep
                                                    ? 'bg-green-500 hover:bg-green-600'
                                                    : isPastStep
                                                      ? 'bg-blue-500'
                                                      : 'bg-gray-300'
                                            } text-white`}
                                        >
                                            {step.buttonLabel}
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            {step.value !== undefined ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={step.value}
                                                        onChange={(e) =>
                                                            updateStepValue(
                                                                step.buttonLabel,
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        disabled={
                                                            !isCurrentStep
                                                        }
                                                        className="w-24"
                                                    />
                                                    <span className="text-gray-500">
                                                        mm
                                                    </span>
                                                </div>
                                            ) : (
                                                step.output
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <h3 className="text-lg font-semibold">Visualization</h3>
                <TriangleDiagram />
            </div>
        </div>
    );
};

export default MarkingStep;
