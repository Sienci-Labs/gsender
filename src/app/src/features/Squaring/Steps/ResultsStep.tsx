import Button from 'app/components/Button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from 'app/components/shadcn/AlertDialog';
import { METRIC_UNITS } from 'app/constants';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { i18n, TransKey, useAppTranslation } from 'app/i18n';
import controller from 'app/lib/controller';
import { toast } from 'app/lib/toaster';
import store from 'app/store';
import { store as reduxStore } from 'app/store/redux';
import { useState } from 'react';
import { useSquaring } from '../context/SquaringContext';
import {
    calculateAngle,
    calculateHypotenuse,
    determineEEPROMAdjustment,
    isValidTriangle,
} from '../utils';

const FM_LOWER_OFFSET_THRESHOLD =
    store.get('workspace.units', METRIC_UNITS) === METRIC_UNITS ? 2 : 0.079;

const ResultsStep = () => {
    const { t } = useAppTranslation();
    const { triangle, jogValues } = useSquaring();
    const [isUpdating, setIsUpdating] = useState(false);
    const { units } = useWorkspaceState();

    const hasValidMeasurements = isValidTriangle(triangle);
    const calculatedHypotenuse = calculateHypotenuse(triangle);
    const hypotenuseDiff = Math.abs(calculatedHypotenuse - triangle.c).toFixed(
        2,
    );
    const angle = calculateAngle(triangle);
    const isSquare = Math.abs(angle) < 0.1; // Less than 0.1 degree deviation
    const isWithinEEPROMThreshold =
        Number(hypotenuseDiff) <= FM_LOWER_OFFSET_THRESHOLD;

    const eepromAdjustment = determineEEPROMAdjustment(triangle, jogValues);
    const needsEEPROMAdjustment =
        eepromAdjustment.x.needsAdjustment ||
        eepromAdjustment.y.needsAdjustment;
    const { settings } = reduxStore.getState().controller.settings;
    const currentXSteps = Number(settings.$100);
    const currentYSteps = Number(settings.$101);

    const handleUpdateEEPROM = async () => {
        setIsUpdating(true);
        try {
            const $100 = eepromAdjustment.x.amount.toFixed(3);
            const $101 = eepromAdjustment.y.amount.toFixed(3);

            controller.command('gcode', [`$100=${$100}`, `$101=${$101}`, '$$']);

            toast.info(i18n.t('notifications:squaring.eepromUpdated'), {
                position: 'bottom-right',
            });
        } catch (error) {
            console.error('Failed to update EEPROM:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const renderResult = () => {
        // Sides that can't form a triangle (usually a typo)
        if (!hasValidMeasurements) {
            return (
                <div className="text-red-950 bg-red-100 p-4 rounded-lg space-y-2 dark:bg-red-950 dark:text-content-primary">
                    <p className="font-bold text-lg">
                        {t('tools:squaring.results.invalid.title')}
                    </p>
                    <p>{t('tools:squaring.results.invalid.body')}</p>
                </div>
            );
        }

        // Machine is square if angle deviation is less than 0.1 degrees
        if (isSquare) {
            return (
                <div className="text-green-950 bg-green-100 p-4 rounded-lg space-y-2">
                    <p className="font-bold text-lg">
                        {t('tools:squaring.results.square.title')}
                    </p>
                    <p className="text-sm">
                        {t('tools:squaring.results.square.body')}
                    </p>
                </div>
            );
        }

        // Tolerable if hypotenuse difference is less than 2mm
        if (isWithinEEPROMThreshold) {
            return (
                <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg space-y-2 dark:bg-yellow-900 dark:text-content-primary">
                    <p className="font-bold text-lg">
                        {t('tools:squaring.results.minor.title')}
                    </p>
                    <p>
                        {t('tools:squaring.results.minor.deviation', {
                            diff: hypotenuseDiff,
                            units,
                        })}
                    </p>

                    <p>
                        {t('tools:squaring.results.minor.adjust', {
                            diff: hypotenuseDiff,
                            units,
                        })}
                    </p>
                </div>
            );
        }

        // Noticeably out of square
        return (
            <div className="text-red-950 bg-red-100 p-4 rounded-lg space-y-2 dark:bg-red-950 dark:text-content-primary">
                <p className="font-bold text-lg">
                    {t('tools:squaring.results.major.title')}
                </p>
                <p>
                    <TransKey
                        i18nKey="tools:squaring.results.major.offBy"
                        values={{
                            angle: angle.toFixed(2),
                            diff: hypotenuseDiff,
                            units,
                        }}
                        components={{ bold: <strong /> }}
                    />
                </p>
                <p>
                    <TransKey
                        i18nKey="tools:squaring.results.major.adjust"
                        values={{ diff: hypotenuseDiff, units }}
                        components={{ bold: <strong /> }}
                    />
                </p>
            </div>
        );
    };

    return (
        <div className="max-w-7xl w-full grid">
            <div className="flex flex-col gap-4">
                <div className="flex flex-row items-start gap-4">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold dark:text-content-primary">
                            {t('tools:squaring.results.title')}
                        </h3>
                        {renderResult()}
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold dark:text-content-primary">
                            {t('tools:squaring.measured.title')}
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-surface-raised dark:text-content-primary">
                                <div className="text-sm text-gray-600 dark:text-content-primary">
                                    {t('tools:squaring.measured.bottomEdge')}
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.a}
                                    {units}
                                </div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-surface-raised dark:text-content-primary">
                                <div className="text-sm text-gray-600 dark:text-content-primary">
                                    {t('tools:squaring.measured.rightEdge')}
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.b}
                                    {units}
                                </div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-surface-raised dark:text-content-primary">
                                <div className="text-sm text-gray-600 dark:text-content-primary">
                                    {t('tools:squaring.measured.diagonal')}
                                </div>
                                <div className="text-xl font-bold">
                                    {triangle.c}
                                    {units}
                                </div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-lg dark:bg-surface-raised dark:text-content-primary">
                                <div className="text-sm text-gray-600 dark:text-content-primary">
                                    {t(
                                        'tools:squaring.measured.angleDeviation',
                                    )}
                                </div>
                                <div className="text-xl font-bold">
                                    {hasValidMeasurements
                                        ? `${angle.toFixed(2)}°`
                                        : '—'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {needsEEPROMAdjustment && hasValidMeasurements && (
                    <div className="flex flex-col justify-center items-start space-y-1">
                        <h3 className="text-lg font-semibold dark:text-content-primary">
                            {t('tools:squaring.eeprom.title')}
                        </h3>
                        <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg border min-h-52 flex flex-col justify-center items-start space-y-1 dark:bg-yellow-950 dark:text-content-primary dark:border-yellow-950">
                            <p>{t('tools:squaring.eeprom.intro')}</p>
                            {/* <div className="grid grid-cols-2 gap-4"> */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="p-2 bg-gray-50 rounded-lg dark:bg-surface-raised">
                                    <div className="text-sm text-gray-600 dark:text-content-primary">
                                        {t('tools:squaring.eeprom.xStepsPerMm')}
                                    </div>
                                    <div className="text-xl font-bold">
                                        {t('tools:squaring.eeprom.current', {
                                            value: currentXSteps,
                                        })}
                                    </div>
                                    <div className="text-xl font-bold text-blue-600">
                                        {t(
                                            'tools:squaring.eeprom.recommended',
                                            {
                                                value: eepromAdjustment.x.amount.toFixed(
                                                    3,
                                                ),
                                            },
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 rounded-lg dark:bg-surface-raised">
                                    <div className="text-sm text-gray-600 dark:text-content-primary">
                                        {t('tools:squaring.eeprom.yStepsPerMm')}
                                    </div>
                                    <div className="text-xl font-bold">
                                        {t('tools:squaring.eeprom.current', {
                                            value: currentYSteps,
                                        })}
                                    </div>
                                    <div className="text-xl font-bold text-blue-600">
                                        {t(
                                            'tools:squaring.eeprom.recommended',
                                            {
                                                value: eepromAdjustment.y.amount.toFixed(
                                                    3,
                                                ),
                                            },
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-row gap-4">
                                <div className="mt-1 xl:mt-4">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button disabled={isUpdating}>
                                                {isUpdating
                                                    ? t(
                                                          'tools:squaring.eeprom.updating',
                                                      )
                                                    : t(
                                                          'tools:squaring.eeprom.update',
                                                      )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-white">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    {t(
                                                        'tools:squaring.eeprom.updateFirmware',
                                                    )}
                                                </AlertDialogTitle>
                                                <div className="space-y-4">
                                                    <p>
                                                        {t(
                                                            'tools:squaring.eeprom.dialogBody',
                                                        )}
                                                    </p>
                                                    <p>
                                                        <TransKey
                                                            i18nKey="tools:squaring.eeprom.xAxisValue"
                                                            values={{
                                                                value: eepromAdjustment.x.amount.toFixed(
                                                                    3,
                                                                ),
                                                            }}
                                                            components={{
                                                                bold: (
                                                                    <strong />
                                                                ),
                                                            }}
                                                        />
                                                    </p>
                                                    <p>
                                                        <TransKey
                                                            i18nKey="tools:squaring.eeprom.yAxisValue"
                                                            values={{
                                                                value: eepromAdjustment.y.amount.toFixed(
                                                                    3,
                                                                ),
                                                            }}
                                                            components={{
                                                                bold: (
                                                                    <strong />
                                                                ),
                                                            }}
                                                        />
                                                    </p>
                                                </div>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    {t('common:actions.cancel')}
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="border border-blue-500"
                                                    onClick={handleUpdateEEPROM}
                                                    data-testid="sq-update-step-per-mm"
                                                >
                                                    {t(
                                                        'tools:squaring.eeprom.updateFirmware',
                                                    )}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="mt-1 xl:mt-4 text-sm text-yellow-600 dark:text-yellow-400">
                                    <p className="font-bold">
                                        {t(
                                            'tools:squaring.eeprom.warningTitle',
                                        )}
                                    </p>
                                    <p>
                                        {t('tools:squaring.eeprom.warningBody')}
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
