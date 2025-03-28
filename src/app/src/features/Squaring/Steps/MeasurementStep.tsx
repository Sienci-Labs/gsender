import { LuArrowRight } from 'react-icons/lu';
import Button from 'app/components/Button';
import { Input } from 'app/components/shadcn/Input';
import { useSquaring } from '../context/SquaringContext';
import TriangleDiagram from '../components/TriangleDiagram';
import { useState, useEffect } from 'react';

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
        <div className="max-w-7xl w-full grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-8">
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
                        const measurementKey = getMeasurementKey(
                            step.buttonLabel,
                        );

                        return (
                            <div
                                key={step.buttonLabel}
                                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                    isCurrentStep
                                        ? 'bg-green-50 border border-green-200'
                                        : isPastStep
                                          ? 'bg-blue-50 border border-blue-200'
                                          : 'bg-gray-50 border border-gray-200 dark:bg-dark dark:border-gray-700 dark:text-white'
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
                                        <div className="flex-1">
                                            <h4 className="font-medium">
                                                {step.buttonLabel}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Input
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
                                                    className="w-32"
                                                />
                                                <span className="text-gray-500">
                                                    mm
                                                </span>
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
                                                    className={`${
                                                        step.completed
                                                            ? 'bg-blue-500'
                                                            : 'bg-green-500 hover:bg-green-600'
                                                    } text-white min-w-[100px]`}
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
                <h3 className="text-lg font-semibold">Visualization</h3>
                <TriangleDiagram />
            </div>
        </div>
    );
};

export default MeasurementStep;
