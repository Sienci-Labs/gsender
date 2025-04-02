import { useSquaring } from '../context/SquaringContext';
import TriangleDiagram from '../components/TriangleDiagram';
import { calculateHypotenuse, calculateAngle } from '../utils';

const ResultsStep = () => {
    const { triangle } = useSquaring();

    const calculatedHypotenuse = calculateHypotenuse(triangle);
    const hypotenuseDiff = Math.abs(calculatedHypotenuse - triangle.c).toFixed(
        2,
    );
    const angle = calculateAngle(triangle);
    const isSquare = Math.abs(angle) < 0.1; // Less than 0.1 degree deviation

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

        // Tolerable if angle deviation is less than 2 degrees
        if (Math.abs(angle) < 2) {
            return (
                <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg space-y-2 dark:bg-yellow-900 dark:text-white">
                    <p className="font-bold text-lg">
                        Your machine is slightly out of square
                    </p>
                    <p>
                        The deviation is minor ({angle.toFixed(0.5)}°) but you
                        may want to adjust the right Y-axis rail to achieve
                        better squareness.
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
        <div className="max-w-7xl w-full grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-8">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold dark:text-white">
                            Measured Dimensions
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Bottom Edge (1-2)
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.a}mm
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Right Edge (2-3)
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.b}mm
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Diagonal (1-3)
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.c}mm
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg dark:bg-dark dark:text-white">
                                <div className="text-sm text-gray-600 dark:text-white">
                                    Angle Deviation
                                </div>
                                <div className="text-xl font-bold">
                                    {angle.toFixed(2)}°
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold dark:text-white">
                            Results
                        </h3>
                        {renderResult()}
                    </div>

                    {!isSquare && (
                        <div className="space-y-4 dark:text-white">
                            <h3 className="text-lg font-semibold">
                                EEPROM Adjustment Recommendations
                            </h3>
                            <div className="space-y-2">
                                You can also adjust your EEPROM settings for
                                improved accuracy, specifically the steps per mm
                                values.
                            </div>

                            <div>
                                <p>Warning</p>

                                <p>
                                    If your machine is off by a large amount,
                                    updating the EEPROM values for improved
                                    accuracy may cause issues.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <h3 className="text-lg font-semibold dark:text-white">
                    Visualization
                </h3>
                <TriangleDiagram />
            </div>
        </div>
    );
};

export default ResultsStep;
