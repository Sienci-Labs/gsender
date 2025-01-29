import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';

import Button from 'app/components/Button';

import { useSquaring } from '../context/SquaringContext';
import MarkingStep from './MarkingStep';
import MeasurementStep from './MeasurementStep';
import ResultsStep from './ResultsStep';

import xySquaringImage from '../assets/XY_squaring_example.jpg';
import { Jogging } from 'app/features/Jogging';
import ShowJogControls from '../components/ShowJogControls';

const Steps = () => {
    const [started, setStarted] = useState(false);
    const {
        currentMainStep,
        mainSteps,
        goToNextMainStep,
        goToPreviousMainStep,
        resetSquaring,
    } = useSquaring();

    const renderStep = () => {
        switch (currentMainStep) {
            case 0:
                return <MarkingStep />;
            case 1:
                return <MeasurementStep />;
            case 2:
                return <ResultsStep />;
            default:
                return null;
        }
    };

    // Check if current step is complete by verifying all sub-steps are completed
    const isCurrentStepComplete = () => {
        const currentStepData = mainSteps[currentMainStep];
        return currentStepData.subSteps.every((step) => step.completed);
    };

    if (!started) {
        return (
            <div className="flex flex-col gap-4">
                <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <div className="space-y-6">
                        <p>
                            If your y-axis hardstops or endstops aren&apos;t
                            &apos;in-line&apos; when you autosquare your CNC
                            manually or during homing then it will skew the
                            x-axis and produce off-square cuts (see the
                            picture). You can fix this by shimming the y-axis
                            plates, realigning the y-axes, or tuning the dual
                            endstops if your CNC has autosquaring.
                        </p>

                        <p>To know how much adjustment is needed, prepare:</p>

                        <ul className="list-disc list-inside">
                            <li>
                                Something pointed in the router like an old
                                tapered bit, v-bit, or a dowel
                            </li>
                            <li>
                                3 squares of tape marked with an &apos;X&apos;
                            </li>
                            <li>A long ruler or measuring tape</li>
                            <li>
                                The CNC positioned somewhere in the front, left
                                corner with the pointed tip close to the
                                wasteboard
                            </li>
                        </ul>

                        <div className="w-full max-w-96">
                            <Jogging />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <img
                            src={xySquaringImage}
                            alt="XY Squaring Example"
                            className="w-full h-auto"
                        />

                        <p className="text-gray-600 font-bold">
                            Since many CNCs run on two independent rails in the
                            Y-axis, misalignment between these rails can cause
                            your cutting to become skewed.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 shrink-0">
                    <Button onClick={() => setStarted(true)}>
                        Start XY Squaring
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Progress Bar */}
            <div className="flex gap-4 shrink-0">
                {mainSteps.map((step, index) => (
                    <div
                        key={step.title}
                        className="flex-1 flex items-center gap-4"
                    >
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                index === currentMainStep
                                    ? 'bg-green-500 text-white'
                                    : index < currentMainStep
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 text-gray-600'
                            }`}
                        >
                            {index + 1}
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">{step.title}</div>
                            <div className="text-sm text-gray-500">
                                {step.description}
                            </div>
                        </div>
                        {index < mainSteps.length - 1 && (
                            <div
                                className={`flex-1 h-0.5 ${
                                    index < currentMainStep
                                        ? 'bg-blue-500'
                                        : 'bg-gray-200'
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-center">{renderStep()}</div>

            <div className="flex justify-between mt-4 shrink-0">
                <div className="flex gap-2">
                    <Button
                        onClick={goToPreviousMainStep}
                        disabled={currentMainStep === 0}
                        className="bg-gray-500 hover:bg-gray-600 text-white"
                    >
                        Previous Step
                    </Button>
                    <Button
                        onClick={resetSquaring}
                        className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
                    >
                        <LuRefreshCw className="w-4 h-4" />
                        Start Over
                    </Button>
                    <ShowJogControls />
                </div>
                <Button
                    onClick={goToNextMainStep}
                    disabled={
                        currentMainStep === mainSteps.length - 1 ||
                        !isCurrentStepComplete()
                    }
                    className="bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300"
                >
                    Next Step
                </Button>
            </div>
        </div>
    );
};

export default Steps;
