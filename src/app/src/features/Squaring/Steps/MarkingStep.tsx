import Button from 'app/components/Button';
import { ControlledInput } from 'app/components/ControlledInput';
import { useSquaring } from '../context/SquaringContext';
import TriangleDiagram from '../components/TriangleDiagram';
import { FaClipboard, FaClipboardCheck, FaClipboardList } from 'react-icons/fa';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

const MarkingStep = () => {
    const {
        mainSteps,
        currentMainStep,
        currentSubStep,
        completeStep,
        updateStepValue,
        jogMachine,
    } = useSquaring();
    const { units } = useWorkspaceState();

    const currentMainStepData = mainSteps[currentMainStep];
    const currentSubStepData = currentMainStepData.subSteps[currentSubStep];

    const handleStepComplete = (buttonLabel: string) => {
        completeStep(buttonLabel);
    };

    const handleJog = (buttonLabel: string, value: number, axis: string) => {
        jogMachine(axis, value, units ?? 'mm');
        handleStepComplete(buttonLabel);
    };

    return (
        <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-2 items-start">
            <div className="flex flex-col gap-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold dark:text-white">
                        Instructions
                    </h3>
                    <p className="text-gray-600 dark:text-white h-20">
                        {currentSubStepData.description}
                    </p>
                </div>

                <div className="space-y-1 xl:space-y-2">
                    {currentMainStepData.subSteps.map((step, index) => {
                        const isCurrentStep =
                            index === currentSubStep && !step.completed;
                        const isPastStep =
                            index < currentSubStep || step.completed;
                        const isMovementStep =
                            step.buttonLabel.includes('Move');

                        return (
                            <div
                                key={step.buttonLabel}
                                className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${
                                    isCurrentStep
                                        ? 'bg-blue-50 border border-blue-200'
                                        : isPastStep
                                          ? 'bg-green-50 border border-green-200'
                                          : 'bg-gray-50 border border-gray-200 dark:bg-dark dark:border-gray-700'
                                }`}
                            >
                                <div className={`min-w-8 min-h-8 text-white`}>
                                    {isPastStep && (
                                        <FaClipboardCheck className="min-w-8 min-h-8 text-green-500 " />
                                    )}
                                    {!isCurrentStep && !isPastStep && (
                                        <FaClipboard className="min-w-8 min-h-8 text-gray-300 dark:text-dark-lighter" />
                                    )}
                                    {isCurrentStep && (
                                        <FaClipboardList className="min-w-8 min-h-8 text-blue-500 " />
                                    )}
                                </div>
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
                                            variant={step.buttonVariant}
                                        >
                                            {step.buttonLabel}
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            {step.value !== undefined ? (
                                                <div className="flex items-center gap-2">
                                                    <ControlledInput
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
                                                        suffix={units ?? 'mm'}
                                                    />
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
                <h3 className="text-lg font-semibold dark:text-white">
                    Diagram
                </h3>
                <TriangleDiagram />
            </div>
        </div>
    );
};

export default MarkingStep;
