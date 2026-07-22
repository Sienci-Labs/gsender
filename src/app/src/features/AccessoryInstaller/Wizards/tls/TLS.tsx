import { Wizard } from 'app/features/AccessoryInstaller/types';
import { useValidations } from 'app/features/AccessoryInstaller/hooks/UseValidations.tsx';
import { useMemo } from 'react';
import { TLSOptions } from 'app/features/AccessoryInstaller/Wizards/tls/components/TLSOptions.tsx';
import { TLSLocation } from 'app/features/AccessoryInstaller/Wizards/tls/components/TLSLocation.tsx';
import { ManualToolChangePosition } from 'app/features/AccessoryInstaller/Wizards/tls/components/ManualToolChangePosition.tsx';
import { TLSCompletion } from 'app/features/AccessoryInstaller/Wizards/tls/components/Completion.tsx';
import { ContinuityCheck } from 'app/features/AccessoryInstaller/Wizards/tls/components/ContinuityCheck.tsx';
import { TLSContinuitySidebar } from 'app/features/AccessoryInstaller/Wizards/tls/components/TLSContinuitySidebar.tsx';
import { Jogging } from 'app/features/Jogging';
import store from 'app/store';

import TLS_STEP_ONE from './assets/TLS_Step_01.png';
import TLS_STEP_TWO from './assets/TLS_Step_02.png';
import TLS_STEP_THREE from './assets/TLS_Step_02.png';

const HELP_URL = 'https://resources.sienci.com/view/addons-tls/';

export function useSienciTLSWizard(): Wizard {
    const { connectionValidation, homingValidation, grblHAlValidator } = useValidations();

    const validations = useMemo(
        () => [connectionValidation, homingValidation, grblHAlValidator],
        [connectionValidation, homingValidation],
    );

    return useMemo<Wizard>(
        () => ({
            id: 'sienci-tls',
            title: 'Sienci TLS',
            image: TLS_STEP_ONE,
            validations: [...validations],
            helpUrl: HELP_URL,
            subWizards: [
                {
                    id: 'tls-setup',
                    title: 'TLS Setup Wizard',
                    description:
                        'Configure your Tool Length Sensor and tool change behaviour',
                    estimatedTime: '5 - 15 minutes',
                    completionPage: TLSCompletion,
                    completionImage: TLS_STEP_ONE,
                    steps: [
                        {
                            id: 'options',
                            title: 'Tool Change Options',
                            component: TLSOptions,
                            secondaryContent: [
                                {
                                    type: 'link',
                                    title: 'Need help?',
                                    content: 'Follow along in our',
                                    url: HELP_URL,
                                },
                            ],
                        },
                        {
                            id: 'tls-location',
                            title: 'Set TLS Location',
                            component: TLSLocation,
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
                                    title: 'Need help?',
                                    content: 'Follow along in our',
                                    url: HELP_URL,
                                },
                            ],
                        },
                        {
                            id: 'manual-position',
                            title: 'Set Tool Change Location',
                            component: ManualToolChangePosition,
                            autoComplete: () =>
                                !store.get(
                                    'workspace.toolChange.moveToManualPosition',
                                    false,
                                ),
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
                                    title: 'Need help?',
                                    content: 'Follow along in our',
                                    url: HELP_URL,
                                },
                            ],
                        },
                        {
                            id: 'continuity-check',
                            title: 'Verify TLS Continuity',
                            component: ContinuityCheck,
                            secondaryContent: [
                                {
                                    type: 'component',
                                    content: TLSContinuitySidebar,
                                },
                                {
                                    type: 'link',
                                    title: 'Need help?',
                                    content: 'Follow along in our',
                                    url: HELP_URL,
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
