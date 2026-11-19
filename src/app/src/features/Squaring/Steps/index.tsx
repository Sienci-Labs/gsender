import Button from 'app/components/Button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'app/components/shadcn/Popover';
import { GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG } from 'app/constants';
import { Jogging } from 'app/features/Jogging';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { useAppTranslation } from 'app/i18n';
import { cx } from 'class-variance-authority';
import { useEffect, useState } from 'react';
import { LuMove, LuRefreshCw } from 'react-icons/lu';
import xySquaringImage from '../assets/X-Y_Squaring_01.png';
import { useSquaring } from '../context/SquaringContext';
import MarkingStep from './MarkingStep';
import MeasurementStep from './MeasurementStep';
import ResultsStep from './ResultsStep';

const Steps = () => {
    const { t } = useAppTranslation();
    const [started, setStarted] = useState(false);
    const { currentMainStep, mainSteps, goToNextMainStep, resetSquaring } =
        useSquaring();
    const { isConnected } = useTypedSelector((state) => state.connection);
    const status = useTypedSelector((state) => state?.controller.state?.status);
    const isDisabled =
        !isConnected ||
        (status?.activeState !== GRBL_ACTIVE_STATE_IDLE &&
            status?.activeState !== GRBL_ACTIVE_STATE_JOG);

    useEffect(() => {
        resetSquaring();
    }, []);

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
            <div className="flex flex-col gap-2 dark:text-content-primary w-full">
                <div className="max-w-7xl w-full grid gap-4 grid-cols-1 lg:grid-cols-[3fr_2fr]">
                    <div className="space-y-1 text-sm xl:text-base font-normal">
                        <p className="text-gray-600 dark:text-content-secondary">
                            {t('tools:squaring.landing.skewedCuts')}
                        </p>

                        <div className="text-gray-600 dark:text-content-secondary">
                            {t('tools:squaring.landing.prepare')}
                            <ul className="list-disc list-inside">
                                <li>{t('tools:squaring.landing.tape')}</li>
                                <li>{t('tools:squaring.landing.ruler')}</li>
                                <li>{t('tools:squaring.landing.pointer')}</li>
                            </ul>
                        </div>

                        <p className="text-gray-600 dark:text-content-secondary">
                            {t('tools:squaring.landing.position')}
                        </p>

                        <div className="flex justify-center items-center">
                            <div className="w-full max-w-96">
                                <Jogging />
                            </div>
                        </div>
                        {!isConnected && (
                            <div className="text-yellow-800 bg-yellow-100 p-4 xl:p-2 rounded-lg border flex flex-col gap-4 justify-center items-center text-center">
                                <p>
                                    {t('tools:squaring.landing.connectFirst')}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <img
                            src={xySquaringImage}
                            alt={t('tools:squaring.landing.exampleAlt')}
                            className="w-[450px] h-auto border border-gray-200 rounded-lg"
                        />

                        <p className="text-gray-600 font-bold dark:text-content-primary">
                            {t('tools:squaring.landing.skewedCutsCaption')}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 shrink-0">
                    <Button
                        onClick={() => setStarted(true)}
                        disabled={isDisabled}
                    >
                        {t('tools:squaring.landing.start')}
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
                            resetSquaring();
                            setStarted(false);
                        }}
                        icon={<LuRefreshCw className="w-4 h-4" />}
                        text={t('common:wizard.restartWizard')}
                    />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                icon={<LuMove className="w-4 h-4" />}
                                text={t('tools:squaring.jogControls')}
                            />
                        </PopoverTrigger>

                        <PopoverContent className="w-auto">
                            <Jogging />
                        </PopoverContent>
                    </Popover>
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
                        {t('tools:squaring.nextStep')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Steps;
