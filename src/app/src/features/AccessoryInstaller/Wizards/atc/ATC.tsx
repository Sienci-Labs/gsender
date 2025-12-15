import { Wizard } from 'app/features/AccessoryInstaller/types';
import { useValidations } from 'app/features/AccessoryInstaller/hooks/UseValidations.tsx';
import { useMemo } from 'react';
import { Placeholder } from 'app/features/AccessoryInstaller/components/wizard/placeholder.tsx';
import PlaceholderImage from '../assets/placeholder.png';
import { MacroConfiguration } from 'app/features/AccessoryInstaller/Wizards/atc/components/MacroConfiguration.tsx';
import { ControllerConfiguration } from 'app/features/AccessoryInstaller/Wizards/atc/components/ControllerConfiguration.tsx';

export function useSienciATCWizard(): Wizard {
    const { connectionValidation } = useValidations();

    const validations = useMemo(
        () => [connectionValidation],
        [connectionValidation],
    );

    return useMemo<Wizard>(
        () => ({
            id: 'sienci-atc',
            title: 'Sienci ATC',
            validations: [...validations],
            subWizards: [
                {
                    id: 'initial-setup',
                    title: 'Initial Setup',
                    description: 'Configure your ATC for first time use',
                    estimatedTime: '30 minutes - 2 hours',
                    configVersion: '20251126',
                    steps: [
                        {
                            id: 'macro-configuration',
                            title: 'Macro Configuration',
                            component: MacroConfiguration,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: PlaceholderImage,
                                    title: 'SD Card Installation',
                                },
                            ],
                        },
                        {
                            id: 'controller-configuration',
                            title: 'Controller Configuration',
                            component: ControllerConfiguration,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: PlaceholderImage,
                                },
                                {
                                    type: 'link',
                                    title: 'Learn More',
                                    content:
                                        'View our online resources for a full list of settings changes.',
                                    url: 'https://example.com/docs',
                                },
                            ],
                        },
                        {
                            id: 'rack-position',
                            title: 'Rack Position',
                            component: Placeholder,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: PlaceholderImage,
                                },
                                {
                                    type: 'component',
                                    content: Placeholder,
                                },
                            ],
                        },
                        {
                            id: 'tool-length-sensor',
                            title: 'Tool Length Sensor Position',
                            component: Placeholder,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: PlaceholderImage,
                                },
                                {
                                    type: 'component',
                                    content: Placeholder,
                                },
                                {
                                    type: 'link',
                                    title: 'Need Help?',
                                    content:
                                        'Follow along in our online resources',
                                    url: 'https://example.com/docs',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'configure-atc',
                    title: 'Configure ATC',
                    description: 'Adjust ATC settings',
                    estimatedTime: '10 minutes',
                    configVersion: '20251126',
                    steps: [
                        {
                            id: 'atc-settings',
                            title: 'ATC Settings',
                            component: Placeholder,
                            secondaryContent: [],
                        },
                    ],
                },
                {
                    id: 'hardware-check',
                    title: 'Hardware Check',
                    description: 'Verify hardware installation',
                    estimatedTime: '15 minutes',
                    configVersion: '20251126',
                    steps: [
                        {
                            id: 'check-sensors',
                            title: 'Check Sensors',
                            component: Placeholder,
                            secondaryContent: [],
                        },
                    ],
                },
                {
                    id: 'uninstall-atc',
                    title: 'Uninstall ATC',
                    description: 'Remove ATC configuration',
                    estimatedTime: '5 minutes',
                    configVersion: '20251126',
                    steps: [
                        {
                            id: 'remove-config',
                            title: 'Remove Configuration',
                            component: Placeholder,
                            secondaryContent: [],
                        },
                    ],
                },
            ],
        }),
        [validations],
    );
}
