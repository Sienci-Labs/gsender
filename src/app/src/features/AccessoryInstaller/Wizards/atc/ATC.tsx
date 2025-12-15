import { Wizard } from 'app/features/AccessoryInstaller/types';
import { useValidations } from 'app/features/AccessoryInstaller/hooks/UseValidations.tsx';
import { useMemo } from 'react';
import { Placeholder } from 'app/features/AccessoryInstaller/components/wizard/placeholder.tsx';

export function useSienciATCWizard(): Wizard {
    const validations = useValidations();

    return useMemo<Wizard>(
        () => ({
            id: 'sienci-atc',
            title: 'Sienci ATC',
            validations,
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
                            component: Placeholder,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content:
                                        'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=600',
                                    title: 'SD Card Installation',
                                },
                            ],
                        },
                        {
                            id: 'initial-calibration',
                            title: 'Initial Calibration',
                            component: Placeholder,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content:
                                        'https://images.pexels.com/photos/159201/tool-work-bench-hammer-pliers-159201.jpeg?auto=compress&cs=tinysrgb&w=600',
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
                                    content:
                                        'https://images.pexels.com/photos/4792509/pexels-photo-4792509.jpeg?auto=compress&cs=tinysrgb&w=600',
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
                                    content:
                                        'https://images.pexels.com/photos/5691577/pexels-photo-5691577.jpeg?auto=compress&cs=tinysrgb&w=600',
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
