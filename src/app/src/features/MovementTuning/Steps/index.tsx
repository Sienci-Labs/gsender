import { useState } from 'react';
import Select from 'react-select';
import { LuArrowRight } from 'react-icons/lu';

import controller from 'app/lib/controller';
import { Button } from 'app/components/Button';
import { Input } from 'app/components/Input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogTrigger,
} from 'app/components/shadcn/AlertDialog';

import xAxisCalibrationImage1 from '../assets/X_axis-calibration_1.png';
import xAxisCalibrationImage2 from '../assets/X_axis-calibration_2.png';

import yAxisCalibrationImage1 from '../assets/Y_axis-calibration_1.png';
import yAxisCalibrationImage2 from '../assets/Y_axis-calibration_2.png';

import zAxisCalibrationImage1 from '../assets/Z_axis-calibration_1.png';
import zAxisCalibrationImage2 from '../assets/Z_axis-calibration_2.png';

import { Jogging } from '../../Jogging';
import { getEEPROMSettingKey, calculateNewStepsPerMM } from '../utils';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { EEPROM } from 'app/definitions/firmware';

const Steps = () => {
    const [status, setStatus] = useState<'initial' | 'started'>('initial');
    const [selectedAxis, setSelectedAxis] = useState<'x' | 'y' | 'z'>('x');
    const [currentStep, setCurrentStep] = useState(0);
    const [markLocationCompleted, setMarkLocationCompleted] = useState(false);
    const [moveAxisCompleted, setMoveAxisCompleted] = useState(false);
    const [setTravelCompleted, setSetTravelCompleted] = useState(false);
    const [moveDistance, setMoveDistance] = useState(100);
    const [measuredDistance, setMeasuredDistance] = useState(100);
    const { settings } = useTypedSelector((state) => state.controller.settings);
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );

    const reset = () => {
        setStatus('initial');
        setSelectedAxis('x');
        setCurrentStep(0);
        setMarkLocationCompleted(false);
        setMoveAxisCompleted(false);
        setSetTravelCompleted(false);
        setMoveDistance(100);
        setMeasuredDistance(100);
    };

    const eepromKey = getEEPROMSettingKey(selectedAxis);

    const currentStepsPerMM = Number(settings[eepromKey as EEPROM]);

    const isCompleted =
        markLocationCompleted && moveAxisCompleted && setTravelCompleted;

    const stepImage =
        currentStep === 0
            ? {
                  x: xAxisCalibrationImage1,
                  y: yAxisCalibrationImage1,
                  z: zAxisCalibrationImage1,
              }[selectedAxis]
            : {
                  x: xAxisCalibrationImage2,
                  y: yAxisCalibrationImage2,
                  z: zAxisCalibrationImage2,
              }[selectedAxis];

    if (status === 'initial') {
        const starterImage = {
            x: xAxisCalibrationImage1,
            y: yAxisCalibrationImage1,
            z: zAxisCalibrationImage1,
        }[selectedAxis];

        return (
            <div className="flex flex-col gap-4">
                <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <div className="space-y-6">
                        <p className="dark:text-white">
                            If you're looking to use your CNC for more accurate
                            work and notice a specific axis is always off by a
                            small amount - say 102mm instead of 100 - then use
                            this tool.
                        </p>

                        <p className="dark:text-white">
                            Since CNC firmware needs to understand its hardware
                            to make exact movements, small manufacturing
                            variations in the motors, lead screws, pulleys, or
                            incorrect firmware will create inaccuracies over
                            longer distances.
                        </p>

                        <p className="dark:text-white">
                            By testing for this difference using a marker or
                            tape and a measuring tape, this tool will better
                            tune the firmware to your machine.
                        </p>

                        <div className="flex gap-2 items-center">
                            <label className="min-w-24 font-bold dark:text-white">
                                Axis to Tune
                            </label>
                            <Select
                                options={[
                                    {
                                        label: 'X-Axis',
                                        value: 'x',
                                    },
                                    {
                                        label: 'Y-Axis',
                                        value: 'y',
                                    },
                                    {
                                        label: 'Z-Axis',
                                        value: 'z',
                                    },
                                ]}
                                onChange={(data: {
                                    label: string;
                                    value: typeof selectedAxis;
                                }) => setSelectedAxis(data.value)}
                                value={{
                                    label: `${selectedAxis.toUpperCase()}-Axis`,
                                    value: selectedAxis,
                                }}
                                placeholder="Select Axis"
                                className="w-full"
                            />
                        </div>

                        <div className="w-full max-w-96">
                            <Jogging />
                        </div>

                        {!isConnected && (
                            <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg border flex flex-col gap-4 justify-center items-center text-center">
                                <p>
                                    Please connect to a device before starting
                                    the movement tuning wizard.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-4">
                        <img
                            src={starterImage}
                            alt="Movement Tuning Example"
                            className="w-full h-auto border border-gray-200 rounded-lg"
                        />

                        <p className="text-gray-600 font-bold dark:text-white">
                            Whichever axis you'll be tuning, please place it in
                            an initial location so that it'll have space to move
                            to the right (for X), backwards (for Y), and
                            downwards (for Z).
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 shrink-0">
                    <Button
                        onClick={() => setStatus('started')}
                        variant="outline"
                        disabled={!isConnected}
                    >
                        Start Movement Tuning
                    </Button>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        if (moveDistance !== measuredDistance) {
            return (
                <div className="flex flex-col gap-4">
                    <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-yellow-950 dark:text-white dark:border-yellow-950">
                        <span>
                            Your {selectedAxis.toUpperCase()}-axis is off by{' '}
                            <strong>
                                {moveDistance - measuredDistance} mm.
                            </strong>{' '}
                            Consider updating the steps-per-mm value in the
                            firmware.
                        </span>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="bg-white text-black"
                                    variant="outline"
                                >
                                    Update Steps-Per-MM
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Update EEPROM Value
                                    </AlertDialogTitle>
                                    <div className="space-y-4">
                                        <p>
                                            This action cannot be undone. This
                                            will update the steps-per-mm value
                                            for the{' '}
                                            <strong>
                                                {selectedAxis.toUpperCase()}
                                                -axis
                                            </strong>{' '}
                                            in the EEPROM settings.
                                        </p>
                                        <p>
                                            EEPROM Setting:{' '}
                                            <strong>
                                                {getEEPROMSettingKey(
                                                    selectedAxis,
                                                )}
                                            </strong>
                                        </p>
                                        <p>
                                            Update To:{' '}
                                            <strong>
                                                {calculateNewStepsPerMM({
                                                    originalStepsPerMM:
                                                        currentStepsPerMM,
                                                    givenDistanceMoved:
                                                        moveDistance,
                                                    actualDistanceMoved:
                                                        measuredDistance,
                                                })}
                                            </strong>
                                        </p>
                                    </div>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>
                                        No, Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction className="bg-blue-500 hover:bg-blue-800 text-white">
                                        Yes, Update Steps-Per-MM
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex gap-4 shrink-0">
                        <Button onClick={reset} variant="outline">
                            Restart Wizard
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                <div className="text-green-800 bg-green-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-green-950 dark:text-white dark:border-green-950">
                    <p>
                        Your {selectedAxis.toUpperCase()}-axis is tuned, there
                        is no need to update the steps per mm in the EEPROM
                        settings.
                    </p>
                </div>

                <div className="flex gap-4 shrink-0">
                    <Button onClick={reset} variant="outline">
                        Restart Wizard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold dark:text-white">
                            Mark Reference Points
                        </h3>
                    </div>

                    <div className="space-y-6">
                        <div
                            className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                currentStep === 0
                                    ? 'bg-green-50 border border-green-200'
                                    : markLocationCompleted
                                      ? 'bg-blue-50 border border-blue-200'
                                      : 'bg-gray-50 border border-gray-200 dark:bg-dark dark:border-gray-700 dark:text-white'
                            }`}
                        >
                            <LuArrowRight
                                className={`min-w-8 min-h-8 p-[4px] text-white rounded-full ${
                                    currentStep === 0
                                        ? 'bg-green-500 animate-pulse'
                                        : markLocationCompleted
                                          ? 'bg-blue-500'
                                          : 'bg-gray-300 dark:bg-dark-lighter dark:text-white'
                                }`}
                            />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={
                                            currentStep !== 0 ||
                                            markLocationCompleted
                                        }
                                        onClick={() => {
                                            setMarkLocationCompleted(true);
                                            setCurrentStep(1);
                                        }}
                                        className={`${
                                            currentStep === 0
                                                ? 'bg-green-500 hover:bg-green-600'
                                                : markLocationCompleted
                                                  ? 'bg-blue-500'
                                                  : 'bg-gray-300'
                                        } text-white`}
                                    >
                                        Mark First Location
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`flex items-center gap-4 p-4 rounded-lg transition-colors dark:bg-dark dark:border-gray-700 dark:text-white ${
                                currentStep === 1
                                    ? 'bg-green-50 border border-green-200'
                                    : moveAxisCompleted
                                      ? 'bg-blue-50 border border-blue-200'
                                      : 'bg-gray-50 border border-gray-200 dark:bg-dark dark:border-gray-700 dark:text-white'
                            }`}
                        >
                            <LuArrowRight
                                className={`min-w-8 min-h-8 p-[4px] text-white rounded-full ${
                                    currentStep === 1
                                        ? 'bg-green-500 animate-pulse'
                                        : moveAxisCompleted
                                          ? 'bg-blue-500'
                                          : 'bg-gray-300 dark:bg-dark-lighter dark:text-white'
                                }`}
                            />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={
                                            currentStep !== 1 ||
                                            moveAxisCompleted
                                        }
                                        onClick={() => {
                                            controller.command('gcode', [
                                                `$J=G91 ${selectedAxis}${moveDistance} F1000`,
                                            ]);
                                            setMoveAxisCompleted(true);
                                            setCurrentStep(2);
                                        }}
                                        className={`${
                                            currentStep === 1
                                                ? 'bg-green-500 hover:bg-green-600'
                                                : moveAxisCompleted
                                                  ? 'bg-blue-500'
                                                  : 'bg-gray-300 dark:bg-dark-lighter dark:text-white'
                                        } text-white`}
                                    >
                                        Move {selectedAxis.toUpperCase()}-axis
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={moveDistance}
                                            onChange={(e) =>
                                                setMoveDistance(
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={currentStep !== 1}
                                            className="w-24"
                                        />
                                        <span className="text-gray-500">
                                            mm
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                currentStep === 2
                                    ? 'bg-green-50 border border-green-200'
                                    : setTravelCompleted
                                      ? 'bg-blue-50 border border-blue-200'
                                      : 'bg-gray-50 border border-gray-200 dark:bg-dark dark:border-gray-700 dark:text-white'
                            }`}
                        >
                            <LuArrowRight
                                className={`min-w-8 min-h-8 p-[4px] text-white rounded-full ${
                                    currentStep === 2
                                        ? 'bg-green-500 animate-pulse'
                                        : setTravelCompleted
                                          ? 'bg-blue-500'
                                          : 'bg-gray-300 dark:bg-dark-lighter dark:text-white'
                                }`}
                            />
                            <div className="flex flex-col gap-2 flex-1">
                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={
                                            currentStep !== 2 ||
                                            setTravelCompleted
                                        }
                                        onClick={() => {
                                            setSetTravelCompleted(true);
                                            setCurrentStep(3);
                                        }}
                                        className={`${
                                            currentStep === 2
                                                ? 'bg-green-500 hover:bg-green-600'
                                                : setTravelCompleted
                                                  ? 'bg-blue-500'
                                                  : 'bg-gray-300'
                                        } text-white`}
                                    >
                                        Set Distance Travelled
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={measuredDistance}
                                            onChange={(e) =>
                                                setMeasuredDistance(
                                                    Number(e.target.value),
                                                )
                                            }
                                            disabled={currentStep !== 2}
                                            className="w-24"
                                        />
                                        <span className="text-gray-500">
                                            mm
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-600 dark:text-white">
                        {currentStep === 0 &&
                            'First, mark next to the gantry in the location shown with your marker, pencil, or using a strip of tape.'}
                        {currentStep === 1 &&
                            "Now move any distance you wish. A larger value will better tune your movement, just make sure you don't hit your machine limits. Once you are ready, clicked the Move Axis Button."}
                        {currentStep === 2 &&
                            'Lastly, measure the distance travelled between the original mark and the current gantry location. Take your time when entering this value, a more accurate measurement will give you better tuning results'}
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-semibold dark:text-white">
                        Diagram
                    </h3>
                    <img
                        src={stepImage}
                        alt="Movement Tuning Step"
                        className="w-full h-auto border border-gray-200 rounded-lg"
                    />
                </div>
            </div>

            <div className="flex gap-4 shrink-0">
                <Button onClick={reset} variant="outline">
                    Restart Wizard
                </Button>
            </div>
        </div>
    );
};

export default Steps;
