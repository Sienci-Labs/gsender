import { Wizard } from 'app/features/AccessoryInstaller/types';
import { useValidations } from 'app/features/AccessoryInstaller/hooks/UseValidations.tsx';
import { useMemo } from 'react';
import TLSPlaceholder from './assets/tls_placeholder.png';
import { TLSOptions } from 'app/features/AccessoryInstaller/Wizards/tls/components/TLSOptions.tsx';
import { TLSLocation } from 'app/features/AccessoryInstaller/Wizards/tls/components/TLSLocation.tsx';
import { ManualToolChangePosition } from 'app/features/AccessoryInstaller/Wizards/tls/components/ManualToolChangePosition.tsx';
import { TLSCompletion } from 'app/features/AccessoryInstaller/Wizards/tls/components/Completion.tsx';
import { Jogging } from 'app/features/Jogging';
import store from 'app/store';

const HELP_URL = 'https://resources.sienci.com/view/addons-tls/';

export function useSienciTLSWizard(): Wizard {
    const { connectionValidation, homingValidation } = useValidations();

    const validations = useMemo(
        () => [connectionValidation, homingValidation],
        [connectionValidation, homingValidation],
    );

    return useMemo<Wizard>(
        () => ({
            id: 'sienci-tls',
            title: 'Sienci TLS',
            image: TLSPlaceholder,
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
                    ],
                },
            ],
        }),
        [validations],
    );
}
