/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
import { useValidations } from 'app/components/Wizard/hooks/UseValidations.tsx';
import type { SecondaryContent, Wizard } from 'app/components/Wizard/types';
import { Jogging } from 'app/features/Jogging';
import { tk, useAppTranslation } from 'app/i18n';
import { useMemo } from 'react';
import xAxisCalibrationImage1 from '../assets/X-Axis_Mark_01.png';
import xAxisCalibrationImage2 from '../assets/X-Axis_Mark_02.png';
import yAxisCalibrationImage1 from '../assets/Y-Axis_Mark_01.png';
import yAxisCalibrationImage2 from '../assets/Y-Axis_Mark_02.png';
import zAxisCalibrationImage1 from '../assets/Z-Axis_Mark_01.png';
import zAxisCalibrationImage2 from '../assets/Z-Axis_Mark_02.png';
import { useMovementTuning } from '../utils/MovementTuningContext';
import AxisSelection from './AxisSelection';
import Completion from './Completion';
import DistanceTravelled from './DistanceTravelled';
import MarkFirstLocation from './MarkFirstLocation';
import MoveAxis from './MoveAxis';

const imageDict: Record<string, string> = {
    x1: xAxisCalibrationImage1,
    x2: xAxisCalibrationImage2,
    y1: yAxisCalibrationImage1,
    y2: yAxisCalibrationImage2,
    z1: zAxisCalibrationImage1,
    z2: zAxisCalibrationImage2,
};

export function useMovementTuningWizard(): Wizard {
    const { connectionValidation, activeStateCheck } = useValidations();
    const { t } = useAppTranslation();
    // const { selectedAxis } = useMovementTuning();

    const validations = useMemo(
        () => [connectionValidation, activeStateCheck],
        [connectionValidation, activeStateCheck],
    );

    const getImage = (item: SecondaryContent, selectedAxis: string) => {
        return imageDict[`${selectedAxis}${item.content}`];
    };

    return useMemo<Wizard>(
        () => ({
            id: 'movement-tuning',
            title: tk('tools:movementTuning.title'),
            image: xAxisCalibrationImage1,
            validations: [...validations],
            helpUrl: 'https://resources.sienci.com/view/gs-calibration-tools/',
            subWizards: [
                {
                    id: 'initial-setup',
                    title: tk('tools:movementTuning.title'),
                    description: (
                        <>
                            <p className="mb-2">
                                {t('tools:movementTuning.intro.accurateWork')}
                            </p>

                            <p className="mb-2">
                                {t('tools:movementTuning.intro.variations')}
                            </p>

                            <p className="mb-2">
                                {t('tools:movementTuning.intro.testing')}
                            </p>
                        </>
                    ),
                    estimatedTime: tk('tools:movementTuning.estimatedTime'),
                    completionPage: Completion,
                    context: useMovementTuning,
                    steps: [
                        {
                            id: 'landing',
                            title: tk(
                                'tools:movementTuning.steps.axisSelection',
                            ),
                            component: AxisSelection,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: '1',
                                    function: getImage,
                                },
                                {
                                    type: 'component',
                                    content: Jogging,
                                    props: {
                                        hideRotary: true,
                                    },
                                },
                                {
                                    type: 'link',
                                    title: tk('common:wizard.needHelp'),
                                    content: tk(
                                        'tools:movementTuning.followAlongIn',
                                    ),
                                    url: 'https://resources.sienci.com/view/gs-calibration-tools/',
                                },
                            ],
                        },
                        {
                            id: 'first-location',
                            title: tk(
                                'tools:movementTuning.steps.markFirstLocation',
                            ),
                            component: MarkFirstLocation,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: '1',
                                    function: getImage,
                                },
                                {
                                    type: 'link',
                                    title: tk('common:wizard.needHelp'),
                                    content: tk(
                                        'tools:movementTuning.followAlongIn',
                                    ),
                                    url: 'https://resources.sienci.com/view/gs-calibration-tools/',
                                },
                            ],
                        },
                        {
                            id: 'move-axis',
                            title: tk('tools:movementTuning.steps.moveAxis'),
                            component: MoveAxis,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: '2',
                                    function: getImage,
                                },
                                {
                                    type: 'link',
                                    title: tk('common:wizard.needHelp'),
                                    content: tk(
                                        'tools:movementTuning.followAlongIn',
                                    ),
                                    url: 'https://resources.sienci.com/view/gs-calibration-tools/',
                                },
                            ],
                        },
                        {
                            id: 'distance-travelled',
                            title: tk(
                                'tools:movementTuning.steps.distanceTravelled',
                            ),
                            component: DistanceTravelled,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: '2',
                                    function: getImage,
                                },
                                {
                                    type: 'link',
                                    title: tk('common:wizard.needHelp'),
                                    content: tk(
                                        'tools:movementTuning.followAlongIn',
                                    ),
                                    url: 'https://resources.sienci.com/view/atc-software/',
                                },
                            ],
                        },
                    ],
                },
            ],
        }),
        [validations, t],
    );
}
