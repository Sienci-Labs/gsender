import { useValidations } from 'app/components/Wizard/hooks/UseValidations.tsx';
import type { Wizard } from 'app/components/Wizard/types';
import { tk } from 'app/i18n';
import { Jogging } from 'app/features/Jogging';
import { useMemo } from 'react';
import XYSquaringExample from '../assets/X-Y_Squaring_01.png';
import TriangleDiagram from '../components/TriangleDiagram';
import { useSquaring } from '../context/SquaringContext';
import Landing from './Landing';
import MarkingStep from './MarkingStep';
import MeasurementStep from './MeasurementStep';
import ResultsStep from './ResultsStep';

export function useXYSquaringWizard(): Wizard {
    const { connectionValidation, activeStateCheck } = useValidations();

    const validations = useMemo(
        () => [connectionValidation, activeStateCheck],
        [connectionValidation, activeStateCheck],
    );

    return useMemo<Wizard>(
        () => ({
            id: 'xy-squaring',
            title: tk('tools:registry.squaring.title'),
            image: XYSquaringExample,
            validations: [...validations],
            helpUrl: 'https://resources.sienci.com/view/gs-calibration-tools/',
            subWizards: [
                {
                    id: 'initial-setup',
                    title: tk('tools:registry.squaring.title'),
                    description: tk('tools:squaring.landing.skewedCuts'),
                    estimatedTime: tk('tools:squaring.wizard.estimatedTime'),
                    completionPage: ResultsStep,
                    context: useSquaring,
                    steps: [
                        {
                            id: 'landing',
                            title: tk('tools:squaring.wizard.initialSetup'),
                            component: Landing,
                            secondaryContent: [
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
                                        'tools:squaring.wizard.followAlong',
                                    ),
                                    url: 'https://resources.sienci.com/view/gs-calibration-tools/',
                                },
                            ],
                        },
                        {
                            id: 'mark-locations',
                            title: tk('tools:squaring.wizard.markLocations'),
                            component: MarkingStep,
                            secondaryContent: [
                                {
                                    type: 'component',
                                    content: TriangleDiagram,
                                    centered: true,
                                },
                                {
                                    type: 'link',
                                    title: tk('common:wizard.needHelp'),
                                    content: tk(
                                        'tools:squaring.wizard.followAlong',
                                    ),
                                    url: 'https://resources.sienci.com/view/gs-calibration-tools/',
                                },
                            ],
                        },
                        {
                            id: 'first-location',
                            title: tk('tools:squaring.wizard.measureDistances'),
                            component: MeasurementStep,
                            secondaryContent: [
                                {
                                    type: 'component',
                                    content: TriangleDiagram,
                                    centered: true,
                                },
                                {
                                    type: 'link',
                                    title: tk('common:wizard.needHelp'),
                                    content: tk(
                                        'tools:squaring.wizard.followAlong',
                                    ),
                                    url: 'https://resources.sienci.com/view/gs-calibration-tools/',
                                },
                            ],
                        },
                    ],
                },
            ],
        }),
        [validations],
    );
}
