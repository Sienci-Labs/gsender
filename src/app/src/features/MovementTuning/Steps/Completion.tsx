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
import type { EEPROM } from 'app/definitions/firmware';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { i18n, TransKey, useAppTranslation } from 'app/i18n';
import controller from 'app/lib/controller';
import { toFixedIfNecessary } from 'app/lib/rounding';
import { toast } from 'sonner';
import { calculateNewStepsPerMM, getEEPROMSettingKey } from '../utils';
import { useMovementTuning } from '../utils/MovementTuningContext';

const Completion = () => {
    const { moveDistance, measuredDistance, selectedAxis } =
        useMovementTuning();
    const { units } = useWorkspaceState();
    const { settings } = useTypedSelector((state) => state.controller.settings);
    const { t } = useAppTranslation();

    const handleUpdateEEPROM = () => {
        const currentStepsPerMM = Number(settings[eepromKey as EEPROM]);

        const newStepsPerMM = calculateNewStepsPerMM({
            originalStepsPerMM: currentStepsPerMM,
            givenDistanceMoved: moveDistance,
            actualDistanceMoved: measuredDistance,
        });

        controller.command('gcode', [`${eepromKey}=${newStepsPerMM}`, '$$']);

        toast.info(i18n.t('notifications:movementTuning.stepsUpdated'), {
            position: 'bottom-right',
        });
    };

    const eepromKey = getEEPROMSettingKey(selectedAxis);
    const currentStepsPerMM = Number(settings[eepromKey as EEPROM]);

    if (moveDistance !== measuredDistance) {
        return (
            <div className="flex flex-col gap-4">
                <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-yellow-950 dark:text-white dark:border-yellow-950">
                    <span>
                        <TransKey
                            i18nKey="tools:movementTuning.completion.offBy"
                            values={{
                                axis: selectedAxis.toUpperCase(),
                                distance: toFixedIfNecessary(
                                    moveDistance - measuredDistance,
                                    4,
                                ),
                                units,
                            }}
                            components={{ bold: <strong /> }}
                        />
                    </span>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="bg-white text-black"
                                variant="outline"
                                testId="mt-update-step-per-mm"
                            >
                                {t(
                                    'tools:movementTuning.completion.updateStepsButton',
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {t(
                                        'tools:movementTuning.completion.updateFirmware',
                                    )}
                                </AlertDialogTitle>
                                <div className="space-y-4">
                                    <p>
                                        <TransKey
                                            i18nKey="tools:movementTuning.completion.updateDescription"
                                            values={{
                                                axis: selectedAxis.toUpperCase(),
                                                setting:
                                                    getEEPROMSettingKey(
                                                        selectedAxis,
                                                    ),
                                            }}
                                            components={{ bold: <strong /> }}
                                        />
                                    </p>
                                    <p>
                                        <TransKey
                                            i18nKey="tools:movementTuning.completion.from"
                                            values={{
                                                value: currentStepsPerMM,
                                            }}
                                            components={{ bold: <strong /> }}
                                        />
                                    </p>
                                    <p>
                                        <TransKey
                                            i18nKey="tools:movementTuning.completion.to"
                                            values={{
                                                value: calculateNewStepsPerMM({
                                                    originalStepsPerMM:
                                                        currentStepsPerMM,
                                                    givenDistanceMoved:
                                                        moveDistance,
                                                    actualDistanceMoved:
                                                        measuredDistance,
                                                }),
                                            }}
                                            components={{ bold: <strong /> }}
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
                                >
                                    {t(
                                        'tools:movementTuning.completion.updateFirmware',
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="text-green-800 bg-green-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-green-950 dark:text-white dark:border-green-950">
                <p>
                    {t('tools:movementTuning.completion.accurate', {
                        axis: selectedAxis.toUpperCase(),
                    })}
                </p>
            </div>
        </div>
    );
};

export default Completion;
