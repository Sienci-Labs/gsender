import { Wizard } from 'app/features/AccessoryInstaller/types';
import { useValidations } from 'app/features/AccessoryInstaller/hooks/UseValidations.tsx';
import { useMemo } from 'react';
import { Placeholder } from 'app/features/AccessoryInstaller/components/wizard/placeholder.tsx';
import PlaceholderImage from '../assets/placeholder.png';
import { MacroConfiguration } from 'app/features/AccessoryInstaller/Wizards/atc/components/MacroConfiguration.tsx';
import { ControllerConfiguration } from 'app/features/AccessoryInstaller/Wizards/atc/components/ControllerConfiguration.tsx';
import { RackPosition } from 'app/features/AccessoryInstaller/Wizards/atc/components/RackPosition.tsx';
import { TLSPosition } from 'app/features/AccessoryInstaller/Wizards/atc/components/TLSPosition.tsx';
import { ATCCompletion } from 'app/features/AccessoryInstaller/Wizards/atc/components/Completion.tsx';
import { Jogging } from 'app/features/Jogging';
import { RestartAndRehome } from 'app/features/AccessoryInstaller/Wizards/atc/components/RestartAndRehome.tsx';
import store from 'app/store';
import { SpindleSetRestart } from 'app/features/AccessoryInstaller/Wizards/atc/components/SpindleSetRestart.tsx';
import { Modbus } from 'app/features/AccessoryInstaller/Wizards/atc/components/Modbus.tsx';

export function useSienciATCWizard(): Wizard {
    const { connectionValidation, coreFirmwareValidation } = useValidations();

    const validations = useMemo(
        () => [connectionValidation, coreFirmwareValidation],
        [connectionValidation, coreFirmwareValidation],
    );
    const storeVersion = store.get('widgets.atc.templates.version', '-');

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
                    configVersion: storeVersion,
                    completionPage: ATCCompletion,
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
                            id: 'restart-rehome',
                            title: 'Rehome',
                            component: RestartAndRehome,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: PlaceholderImage,
                                },
                            ],
                        },
                        {
                            id: 'rack-position',
                            title: 'Rack Position',
                            component: RackPosition,
                            secondaryContent: [
                                {
                                    type: 'component',
                                    content: Jogging,
                                    props: {
                                        hideRotary: true,
                                    },
                                },
                            ],
                        },
                        {
                            id: 'tool-length-sensor',
                            title: 'Tool Length Sensor Position',
                            component: TLSPosition,
                            secondaryContent: [
                                {
                                    type: 'component',
                                    content: Jogging,
                                    props: {
                                        hideRotary: true,
                                    },
                                },
                            ],
                        },
                        {
                            id: 'spindle-config',
                            title: 'Spindle Configuration',
                            component: SpindleSetRestart,
                            secondaryContent: [],
                        },
                        {
                            id: 'modbus-config',
                            title: 'Modbus Configuration',
                            component: Modbus,
                            secondaryContent: [],
                        },
                    ],
                },
                {
                    id: 'configure-atc',
                    title: 'Configure ATC',
                    description: 'Adjust ATC settings',
                    estimatedTime: '10 minutes',
                    configVersion: storeVersion,
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
                    id: 'uninstall-atc',
                    title: 'Uninstall ATC',
                    description: 'Remove ATC configuration',
                    estimatedTime: '5 minutes',
                    configVersion: storeVersion,
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
