import { useState } from 'react';

import { store as reduxStore } from 'app/store/redux';
import Button from 'app/components/Button';
import controller from 'app/lib/controller';

import { useSquaring } from '../context/SquaringContext';
import {
    calculateHypotenuse,
    calculateAngle,
    determineEEPROMAdjustment,
} from '../utils';
import { toast } from 'app/lib/toaster';

const FM_LOWER_OFFSET_THRESHOLD = 2; // mm

const ResultsStep = () => {
    const { triangle, jogValues } = useSquaring();
    const [isUpdating, setIsUpdating] = useState(false);

    const calculatedHypotenuse = calculateHypotenuse(triangle);
    const hypotenuseDiff = Math.abs(calculatedHypotenuse - triangle.c).toFixed(
        2,
    );
    const angle = calculateAngle(triangle);
    const isSquare = Math.abs(angle) < 0.1; // Less than 0.1 degree deviation
    const isWithinEEPROMThreshold =
        Number(hypotenuseDiff) <= FM_LOWER_OFFSET_THRESHOLD;

    const eepromAdjustment = determineEEPROMAdjustment(triangle, jogValues);
    const { settings } = reduxStore.getState().controller.settings;
    const currentXSteps = Number(settings.$100);
    const currentYSteps = Number(settings.$101);

    const handleUpdateEEPROM = async () => {
        setIsUpdating(true);
        try {
            const $100 = eepromAdjustment.x.amount.toFixed(3);
            const $101 = eepromAdjustment.y.amount.toFixed(3);

            controller.command('gcode', [`$100=${$100}`, `$101=${$101}`]);

            toast.info('Updated EEPROM values');
        } catch (error) {
            console.error('Failed to update EEPROM:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const renderResult = () => {
        // Machine is square if angle deviation is less than 0.1 degrees
        if (isSquare) {
            return (
                <div className="text-green-950 bg-green-100 p-4 rounded-lg space-y-2">
                    <p className="font-bold text-lg">
                        Your machine is properly squared!
                    </p>
                    <p className="text-sm">No adjustments are needed.</p>
                </div>
            );
        }

        // Tolerable if hypotenuse difference is less than 2mm
        if (isWithinEEPROMThreshold) {
            return (
                <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg space-y-2 dark:bg-yellow-900 dark:text-white">
                    <p className="font-bold text-lg">
                        Your machine is slightly out of square
                    </p>
                    <p>
                        The deviation is minor ({hypotenuseDiff}mm) but you may
                        want to adjust the right Y-axis rail to achieve better
                        squareness.
                    </p>

                    <p>
                        You can move your either the right y-axis rail forward
                        by {hypotenuseDiff}mm or the left y-axis rail backward
                        by {hypotenuseDiff}mm.
                    </p>
                </div>
            );
        }

        // Noticeably out of square
        return (
            <div className="text-red-950 bg-red-100 p-4 rounded-lg space-y-2 dark:bg-red-950 dark:text-white">
                <p className="font-bold text-lg">
                    Your machine needs adjustment
                </p>
                <p>
                    The machine is off by {angle.toFixed(2)}° or{' '}
                    <strong>{hypotenuseDiff}mm</strong> on the diagonal.
                </p>
                <p>
                    You can move your either the right y-axis rail forward by{' '}
                    <strong>{hypotenuseDiff}mm</strong> or the left y-axis rail
                    backward by <strong>{hypotenuseDiff}mm</strong>.
                </p>
            </div>
        );
    };

    return (
        <div className="max-w-7xl w-full grid">
            <div className="flex flex-col gap-4">
                <div className="flex flex-row items-start gap-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold dark:text-white">
                            Measured Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Bottom Edge (1-2)
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.a}mm
                                </div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Right Edge (2-3)
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.b}mm
                                </div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Diagonal (1-3)
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.c}mm
                                </div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Angle Deviation
                                </div>
                                <div className="text-xl font-bold">
                                    {angle.toFixed(2)}°
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold dark:text-white">
                            Results
                        </h3>
                        {renderResult()}
                    </div>
                </div>

                {!isSquare && isWithinEEPROMThreshold && (
                    <div className="flex flex-col justify-center items-start space-y-1 dark:text-white">
                        <h3 className="text-lg font-semibold">
                            EEPROM Adjustment Recommendations
                        </h3>
                        <div className="space-y-1 w-full">
                            <p>
                                Based on your measurements, we recommend
                                updating your steps per mm values to improve
                                machine accuracy.
                            </p>
                            {/* <div className="grid grid-cols-2 gap-4"> */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="p-2 bg-gray-50 rounded-lg dark:bg-dark">
                                    <div className="text-sm text-gray-600 dark:text-white">
                                        X-Axis Steps/mm
                                    </div>
                                    <div className="text-xl font-bold">
                                        Current: {currentXSteps}
                                    </div>
                                    <div className="text-xl font-bold text-blue-600">
                                        Recommended:{' '}
                                        {eepromAdjustment.x.amount.toFixed(3)}
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-lg dark:bg-dark">
                                    <div className="text-sm text-gray-600 dark:text-white">
                                        Y-Axis Steps/mm
                                    </div>
                                    <div className="text-xl font-bold">
                                        Current: {currentYSteps}
                                    </div>
                                    <div className="text-xl font-bold text-blue-600">
                                        Recommended:{' '}
                                        {eepromAdjustment.y.amount.toFixed(3)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-row gap-4">
                                <div className="mt-1 xl:mt-4">
                                    <Button
                                        onClick={handleUpdateEEPROM}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating
                                            ? 'Updating...'
                                            : 'Update EEPROM Settings'}
                                    </Button>
                                </div>

                                <div className="mt-1 xl:mt-4 text-sm text-yellow-600 dark:text-yellow-400">
                                    <p className="font-bold">Warning</p>
                                    <p>
                                        Updating EEPROM values can affect your
                                        machine's accuracy. Make sure to verify
                                        the new settings after applying them.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    // </div>
                )}
            </div>
        </div>
    );
};

export default ResultsStep;
