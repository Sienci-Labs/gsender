import Button from 'app/components/Button';
import { ControlledInput } from 'app/components/ControlledInput';
import { useSquaring } from '../context/SquaringContext';
import TriangleDiagram from '../components/TriangleDiagram';
import { useState, useEffect } from 'react';
import { FaClipboard, FaClipboardCheck, FaClipboardList } from 'react-icons/fa';

const MeasurementStep = () => {
    const {
        mainSteps,
        currentMainStep,
        currentSubStep,
        completeStep,
        updateTriangle,
    } = useSquaring();

    const [measurementInputs, setMeasurementInputs] = useState({
        '1-2': '',
        '2-3': '',
        '1-3': '',
    });

    useEffect(() => {
        setMeasurementInputs({
            '1-2': '',
            '2-3': '',
            '1-3': '',
        });
    }, [currentMainStep]);

    const currentMainStepData = mainSteps[currentMainStep];
    const currentSubStepData = currentMainStepData.subSteps[currentSubStep];

    const handleMeasurementComplete = (buttonLabel: string) => {
        const value = Number(measurementInputs[getMeasurementKey(buttonLabel)]);
        if (value <= 0) return;

        // Map the measurement to the correct triangle side
        const triangleSide = buttonLabel.includes('1-2')
            ? 'a'
            : buttonLabel.includes('2-3')
              ? 'b'
              : 'c';

        updateTriangle(triangleSide, value);
        completeStep(buttonLabel);
    };

    const getMeasurementKey = (buttonLabel: string) => {
        if (buttonLabel.includes('1-2')) return '1-2';
        if (buttonLabel.includes('2-3')) return '2-3';
        return '1-3';
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

                <div className="space-y-6">
                    {currentMainStepData.subSteps.map((step, index) => {
                        const isCurrentStep =
                            index === currentSubStep && !step.completed;
                        const isPastStep =
                            index < currentSubStep || step.completed;
                        const measurementKey = getMeasurementKey(
                            step.buttonLabel,
                        );

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
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                {step.buttonLabel}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <ControlledInput
                                                    type="number"
                                                    placeholder="Enter measurement"
                                                    value={
                                                        measurementInputs[
                                                            measurementKey
                                                        ]
                                                    }
                                                    onChange={(e) => {
                                                        setMeasurementInputs(
                                                            (prev) => ({
                                                                ...prev,
                                                                [measurementKey]:
                                                                    e.target
                                                                        .value,
                                                            }),
                                                        );
                                                    }}
                                                    suffix="mm"
                                                />
                                                <Button
                                                    disabled={
                                                        !measurementInputs[
                                                            measurementKey
                                                        ] ||
                                                        Number(
                                                            measurementInputs[
                                                                measurementKey
                                                            ],
                                                        ) <= 0
                                                    }
                                                    onClick={() =>
                                                        handleMeasurementComplete(
                                                            step.buttonLabel,
                                                        )
                                                    }
                                                >
                                                    {step.completed
                                                        ? 'Update'
                                                        : 'Confirm'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <h3 className="text-lg font-semibold">Diagram</h3>
                <TriangleDiagram />
            </div>
        </div>
    );
};

export default MeasurementStep;
