import { useState } from 'react';
import { LuRefreshCw } from 'react-icons/lu';

import Button from 'app/components/Button';

import { useSquaring } from '../context/SquaringContext';
import MarkingStep from './MarkingStep';
import MeasurementStep from './MeasurementStep';
import ResultsStep from './ResultsStep';

import xySquaringImage from '../assets/XY_squaring_example.jpg';
import { Jogging } from 'app/features/Jogging';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { cx } from 'class-variance-authority';

const Steps = () => {
    const [started, setStarted] = useState(false);
    const { currentMainStep, mainSteps, goToNextMainStep, resetSquaring } =
        useSquaring();
    const { isConnected } = useTypedSelector((state) => state.connection);

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
        resetSquaring();
        return (
            <div className="flex flex-col gap-2 xl:gap-0 dark:text-white w-full">
                <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-[3fr_2fr]">
                    <div className="space-y-1 text-sm xl:text-base font-normal">
                        <p className="text-gray-500 dark:text-gray-300">
                            If your CNC is making skewed cuts (pictured),
                            it&apos;s because the X and Y axes aren&apos;t
                            squared to each other. This can be fixed.
                        </p>

                        <div className="text-gray-500 dark:text-gray-300">
                            To know how much adjustment is needed, follow the
                            steps below. Prepare:
                            <ul className="list-disc list-inside">
                                <li>
                                    3 squares of tape marked with an
                                    &apos;X&apos;
                                </li>
                                <li>A long ruler or measuring tape</li>
                                <li>
                                    Put something pointed in the spindle like an
                                    old v-bit, tapered bit, pencil, or a pointed
                                    dowel
                                </li>
                            </ul>
                        </div>

                        <p className="text-gray-500 dark:text-gray-300">
                            Use the jog buttons to position your CNC near its
                            front, left corner with the pointed tip almost
                            touching the wasteboard, then continue below.
                        </p>

                        <div className="flex justify-center items-center">
                            <div className="w-full max-w-96 -mt-4">
                                <Jogging />
                            </div>
                        </div>
                        {!isConnected && (
                            <div className="text-yellow-800 bg-yellow-100 p-4 xl:p-2 rounded-lg border flex flex-col gap-4 justify-center items-center text-center">
                                <p>
                                    Please connect to a device before starting
                                    the squaring wizard.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <img
                            src={xySquaringImage}
                            alt="XY Squaring Example"
                            className="w-[450px] h-auto border border-gray-200 rounded-lg"
                        />

                        <p className="text-gray-600 font-bold dark:text-white">
                            If the X and Y axes aren't squared to each other on
                            your CNC then it will cause your cuts to end up
                            skewed.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 shrink-0">
                    <Button
                        onClick={() => setStarted(true)}
                        disabled={!isConnected}
                    >
                        Start XY Squaring
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 xl:gap-3">
            <div className="flex justify-center">{renderStep()}</div>

            <div className="flex justify-start gap-4 mt-4 xl:mt-1 shrink-0">
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            setStarted(false);
                        }}
                        icon={<LuRefreshCw className="w-4 h-4" />}
                        text="Restart Wizard"
                    />
                </div>
                <div
                    className={cx('flex gap-2', {
                        hidden: currentMainStep === mainSteps.length - 1,
                    })}
                >
                    <Button
                        onClick={goToNextMainStep}
                        disabled={!isCurrentStepComplete()}
                    >
                        Next Step
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Steps;
