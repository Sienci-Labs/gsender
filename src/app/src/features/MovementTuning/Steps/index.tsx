/** biome-ignore-all lint/a11y/noLabelWithoutControl: <> */
import { Button } from 'app/components/Button';
import { ControlledInput } from 'app/components/ControlledInput';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG } from 'app/constants';
import type { EEPROM } from 'app/definitions/firmware';
import { jogAxis } from 'app/features/Jogging/utils/Jogging';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import { i18n, TransKey, useAppTranslation } from 'app/i18n';
import controller from 'app/lib/controller';
import { getThemeCssColor } from 'app/lib/getThemeCssColor';
import { toFixedIfNecessary } from 'app/lib/rounding';
import { toast } from 'app/lib/toaster';
import { useState } from 'react';
import { FaClipboard, FaClipboardCheck, FaClipboardList } from 'react-icons/fa';
import { LuMove, LuRefreshCw } from 'react-icons/lu';
import Select from 'react-select';
import { Jogging } from '../../Jogging';
import xAxisCalibrationImage1 from '../assets/X-Axis_Mark_01.png';
import xAxisCalibrationImage2 from '../assets/X-Axis_Mark_02.png';
import yAxisCalibrationImage1 from '../assets/Y-Axis_Mark_01.png';
import yAxisCalibrationImage2 from '../assets/Y-Axis_Mark_02.png';
import zAxisCalibrationImage1 from '../assets/Z-Axis_Mark_01.png';
import zAxisCalibrationImage2 from '../assets/Z-Axis_Mark_02.png';
import { calculateNewStepsPerMM, getEEPROMSettingKey } from '../utils';

// Neutral react-select colors come from the Tailwind-backed CSS variables
// (see index.css) so no neutral hex is hardcoded here.
const axisSelectStyles = {
    control: (provided: Record<string, unknown>) => ({
        ...provided,
        backgroundColor:
            getThemeCssColor('--surface-sunken') || provided.backgroundColor,
        borderColor:
            getThemeCssColor('--outline-default') || provided.borderColor,
    }),
    menu: (provided: Record<string, unknown>) => ({
        ...provided,
        backgroundColor:
            getThemeCssColor('--surface-elevated') || provided.backgroundColor,
        border: `1px solid ${getThemeCssColor('--outline-default') || 'transparent'}`,
    }),
    option: (
        provided: Record<string, unknown>,
        state: { isFocused: boolean },
    ) => ({
        ...provided,
        backgroundColor: state.isFocused
            ? getThemeCssColor('--surface-hover') || provided.backgroundColor
            : 'transparent',
        color: getThemeCssColor('--content-secondary') || provided.color,
    }),
    singleValue: (provided: Record<string, unknown>) => ({
        ...provided,
        color: getThemeCssColor('--content-primary') || provided.color,
    }),
};

const Steps = () => {
    const { t } = useAppTranslation();
    const [status, setStatus] = useState<'initial' | 'started'>('initial');
    const [selectedAxis, setSelectedAxis] = useState<'x' | 'y' | 'z'>('x');
    const [currentStep, setCurrentStep] = useState(0);
    const [markLocationCompleted, setMarkLocationCompleted] = useState(false);
    const [moveAxisCompleted, setMoveAxisCompleted] = useState(false);
    const [setTravelCompleted, setSetTravelCompleted] = useState(false);
    const { units } = useWorkspaceState();
    const [moveDistance, setMoveDistance] = useState(units === 'mm' ? 100 : 4);
    const [measuredDistance, setMeasuredDistance] = useState(
        units === 'mm' ? 100 : 4,
    );
    const { settings } = useTypedSelector((state) => state.controller.settings);
    const isConnected = useTypedSelector(
        (state) => state.connection.isConnected,
    );
    const controllerStatus = useTypedSelector(
        (state) => state?.controller.state?.status,
    );

    const isDisabled =
        !isConnected ||
        (controllerStatus?.activeState !== GRBL_ACTIVE_STATE_IDLE &&
            controllerStatus?.activeState !== GRBL_ACTIVE_STATE_JOG);

    const reset = () => {
        setStatus('initial');
        setSelectedAxis('x');
        setCurrentStep(0);
        setMarkLocationCompleted(false);
        setMoveAxisCompleted(false);
        setSetTravelCompleted(false);
        setMoveDistance(units === 'mm' ? 100 : 4);
        setMeasuredDistance(units === 'mm' ? 100 : 4);
    };

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
            <div className="flex flex-col gap-4 xl:gap-0">
                <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-[3fr_2fr]">
                    <div className="space-y-1 text-sm xl:text-base font-normal">
                        <p className="text-gray-600 dark:text-content-secondary">
                            {t('tools:movementTuning.intro.accurateWork')}
                        </p>

                        <p className="text-gray-600 dark:text-content-secondary">
                            {t('tools:movementTuning.intro.variations')}
                        </p>

                        <p className="text-gray-600 dark:text-content-secondary">
                            {t('tools:movementTuning.intro.testing')}
                        </p>

                        <div className="flex gap-2 items-center">
                            <label className="min-w-24 font-bold dark:text-content-primary">
                                {t(
                                    'tools:movementTuning.axisSelection.axisToTune',
                                )}
                            </label>
                            <Select
                                styles={axisSelectStyles}
                                options={[
                                    {
                                        label: t(
                                            'tools:movementTuning.axisOption',
                                            {
                                                axis: 'X',
                                            },
                                        ),
                                        value: 'x',
                                    },
                                    {
                                        label: t(
                                            'tools:movementTuning.axisOption',
                                            {
                                                axis: 'Y',
                                            },
                                        ),
                                        value: 'y',
                                    },
                                    {
                                        label: t(
                                            'tools:movementTuning.axisOption',
                                            {
                                                axis: 'Z',
                                            },
                                        ),
                                        value: 'z',
                                    },
                                ]}
                                onChange={(data: {
                                    label: string;
                                    value: typeof selectedAxis;
                                }) => {
                                    setSelectedAxis(data.value);
                                    if (data.value === 'z') {
                                        setMoveDistance(
                                            units === 'mm' ? -50 : -2,
                                        );
                                        setMeasuredDistance(
                                            units === 'mm' ? -50 : -2,
                                        );
                                    } else {
                                        setMoveDistance(
                                            units === 'mm' ? 100 : 4,
                                        );
                                        setMeasuredDistance(
                                            units === 'mm' ? 100 : 4,
                                        );
                                    }
                                }}
                                value={{
                                    label: t(
                                        'tools:movementTuning.axisOption',
                                        {
                                            axis: selectedAxis.toUpperCase(),
                                        },
                                    ),
                                    value: selectedAxis,
                                }}
                                placeholder={t(
                                    'tools:movementTuning.axisSelection.selectAxis',
                                )}
                                className="w-full"
                            />
                        </div>

                        <div className="flex justify-center items-center">
                            <div className="w-full max-w-96">
                                <Jogging />
                            </div>
                        </div>

                        {!isConnected && (
                            <div className="text-yellow-800 bg-yellow-100 p-4 xl:p-2 rounded-lg border flex flex-col gap-4 justify-center items-center text-center">
                                <p>
                                    {t(
                                        'tools:movementTuning.axisSelection.connectFirst',
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <img
                            src={starterImage}
                            alt={t('tools:movementTuning.legacy.exampleAlt')}
                            className="w-[440px] h-auto border border-gray-200 rounded-lg"
                        />

                        <p className="text-gray-600 font-bold dark:text-content-primary">
                            {t('tools:movementTuning.axisSelection.placement')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 shrink-0">
                    <Button
                        onClick={() => setStatus('started')}
                        variant="outline"
                        disabled={isDisabled}
                    >
                        {t('tools:movementTuning.legacy.start')}
                    </Button>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        if (moveDistance !== measuredDistance) {
            return (
                <div className="flex flex-col gap-4">
                    <div className="text-yellow-800 bg-yellow-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-yellow-950 dark:text-content-primary dark:border-yellow-950">
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
                                                components={{
                                                    bold: <strong />,
                                                }}
                                            />
                                        </p>
                                        <p>
                                            <TransKey
                                                i18nKey="tools:movementTuning.completion.from"
                                                values={{
                                                    value: currentStepsPerMM,
                                                }}
                                                components={{
                                                    bold: <strong />,
                                                }}
                                            />
                                        </p>
                                        <p>
                                            <TransKey
                                                i18nKey="tools:movementTuning.completion.to"
                                                values={{
                                                    value: calculateNewStepsPerMM(
                                                        {
                                                            originalStepsPerMM:
                                                                currentStepsPerMM,
                                                            givenDistanceMoved:
                                                                moveDistance,
                                                            actualDistanceMoved:
                                                                measuredDistance,
                                                        },
                                                    ),
                                                }}
                                                components={{
                                                    bold: <strong />,
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
                                    >
                                        {t(
                                            'tools:movementTuning.completion.updateFirmware',
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex gap-4 shrink-0">
                        <Button
                            onClick={reset}
                            variant="outline"
                            icon={<LuRefreshCw className="w-4 h-4" />}
                            text={t('common:wizard.restartWizard')}
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    icon={<LuMove className="w-4 h-4" />}
                                    text={t(
                                        'tools:movementTuning.legacy.jogControls',
                                    )}
                                />
                            </PopoverTrigger>

                            <PopoverContent className="w-auto">
                                <Jogging />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-4">
                <div className="text-green-800 bg-green-100 p-4 rounded-lg border min-h-52 flex flex-col gap-4 justify-center items-center text-lg dark:bg-green-950 dark:text-content-primary dark:border-green-950">
                    <p>
                        {t('tools:movementTuning.completion.accurate', {
                            axis: selectedAxis.toUpperCase(),
                        })}
                    </p>
                </div>

                <div className="flex gap-4 shrink-0">
                    <Button
                        onClick={reset}
                        variant="outline"
                        icon={<LuRefreshCw className="w-4 h-4" />}
                        text={t('common:wizard.restartWizard')}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                icon={<LuMove className="w-4 h-4" />}
                                text={t(
                                    'tools:movementTuning.legacy.jogControls',
                                )}
                            />
                        </PopoverTrigger>

                        <PopoverContent className="w-auto">
                            <Jogging />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-center">
                <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-2 items-start">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold dark:text-content-primary">
                                {t('tools:movementTuning.legacy.instructions')}
                            </h3>
                            <p className="h-20 text-gray-600 dark:text-content-primary">
                                {currentStep === 0 &&
                                    t(
                                        'tools:movementTuning.markFirstLocation.instructions',
                                    )}
                                {currentStep === 1 &&
                                    t(
                                        'tools:movementTuning.moveAxis.instructions',
                                    )}
                                {currentStep === 2 &&
                                    t(
                                        'tools:movementTuning.distanceTravelled.instructions',
                                    )}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div
                                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                    currentStep === 0
                                        ? 'bg-blue-50 border border-blue-200 bg-opacity-40'
                                        : markLocationCompleted
                                          ? 'bg-green-50 border border-green-200 bg-opacity-30'
                                          : 'bg-amber-600 border border-amber-600 bg-opacity-10 border-opacity-10 opacity-50 dark:bg-surface-raised dark:border-outline dark:text-content-primary'
                                }`}
                            >
                                <div className={`min-w-8 min-h-8 text-white`}>
                                    {markLocationCompleted && (
                                        <FaClipboardCheck className="min-w-8 min-h-8 text-green-500 " />
                                    )}
                                    {currentStep !== 0 &&
                                        !markLocationCompleted && (
                                            <FaClipboard className="min-w-8 min-h-8 text-amber-600 dark:text-content-muted" />
                                        )}
                                    {currentStep === 0 && (
                                        <FaClipboardList className="min-w-8 min-h-8 text-blue-600 dark:text-blue-400 " />
                                    )}
                                </div>
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
                                            variant="secondary"
                                        >
                                            {t(
                                                'tools:movementTuning.steps.markFirstLocation',
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`flex items-center gap-4 p-4 rounded-lg transition-colors dark:bg-surface-raised dark:border-outline dark:text-content-primary ${
                                    currentStep === 1
                                        ? 'bg-blue-50 border border-blue-200 bg-opacity-40'
                                        : moveAxisCompleted
                                          ? 'bg-green-50 border border-green-200 bg-opacity-30'
                                          : 'bg-amber-600 border border-amber-600 bg-opacity-10 border-opacity-10 opacity-50 dark:bg-surface-raised dark:border-amber-700 dark:text-content-primary'
                                }`}
                            >
                                <div className={`min-w-8 min-h-8 text-white`}>
                                    {moveAxisCompleted && (
                                        <FaClipboardCheck className="min-w-8 min-h-8 text-green-500 " />
                                    )}
                                    {currentStep !== 1 &&
                                        !moveAxisCompleted && (
                                            <FaClipboard className="min-w-8 min-h-8 text-amber-600 dark:text-content-muted" />
                                        )}
                                    {currentStep === 1 && (
                                        <FaClipboardList className="min-w-8 min-h-8 text-blue-600 dark:text-blue-400 " />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 flex-1">
                                    <div className="flex items-center gap-4">
                                        <Button
                                            disabled={
                                                currentStep !== 1 ||
                                                moveAxisCompleted
                                            }
                                            onClick={() => {
                                                jogAxis(
                                                    {
                                                        [selectedAxis.toUpperCase()]:
                                                            moveDistance,
                                                    },
                                                    1000,
                                                );
                                                setMoveAxisCompleted(true);
                                                setCurrentStep(2);
                                            }}
                                            variant="alt"
                                        >
                                            {t(
                                                'tools:movementTuning.moveAxis.button',
                                                {
                                                    axis: selectedAxis.toUpperCase(),
                                                },
                                            )}
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            <ControlledInput
                                                type="number"
                                                value={moveDistance}
                                                onChange={(e) =>
                                                    setMoveDistance(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                disabled={currentStep !== 1}
                                                wrapperClassName="w-28"
                                                suffix={units ?? 'mm'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                                    currentStep === 2
                                        ? 'bg-blue-50 border border-blue-200 bg-opacity-40'
                                        : setTravelCompleted
                                          ? 'bg-green-50 border border-green-200 bg-opacity-30'
                                          : 'bg-amber-600 border border-amber-600 bg-opacity-10 border-opacity-10 opacity-50 dark:bg-surface-raised dark:border-outline dark:text-content-primary'
                                }`}
                            >
                                <div className={`min-w-8 min-h-8 text-white`}>
                                    {setTravelCompleted && (
                                        <FaClipboardCheck className="min-w-8 min-h-8 text-green-500 " />
                                    )}
                                    {currentStep !== 2 &&
                                        !setTravelCompleted && (
                                            <FaClipboard className="min-w-8 min-h-8 text-amber-600 dark:text-content-muted" />
                                        )}
                                    {currentStep === 2 && (
                                        <FaClipboardList className="min-w-8 min-h-8 text-blue-600 dark:text-blue-400 " />
                                    )}
                                </div>
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
                                        >
                                            {t(
                                                'tools:movementTuning.steps.distanceTravelled',
                                            )}
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            <ControlledInput
                                                type="number"
                                                value={measuredDistance}
                                                onChange={(e) =>
                                                    setMeasuredDistance(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                disabled={currentStep !== 2}
                                                wrapperClassName="w-28"
                                                suffix={units ?? 'mm'}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <h3 className="text-lg font-semibold dark:text-content-primary">
                            {t('tools:movementTuning.legacy.diagram')}
                        </h3>
                        <img
                            src={stepImage}
                            alt={t('tools:movementTuning.legacy.stepAlt')}
                            className="w-[450px] h-auto border border-gray-200 rounded-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 shrink-0">
                <Button
                    onClick={reset}
                    variant="outline"
                    icon={<LuRefreshCw className="w-4 h-4" />}
                    text={t('common:wizard.restartWizard')}
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            icon={<LuMove className="w-4 h-4" />}
                            text={t('tools:movementTuning.legacy.jogControls')}
                        />
                    </PopoverTrigger>

                    <PopoverContent className="w-auto">
                        <Jogging />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

export default Steps;
export { calculateNewStepsPerMM } from '../utils';
