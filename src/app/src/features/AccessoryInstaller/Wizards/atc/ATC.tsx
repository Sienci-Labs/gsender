import { Wizard } from 'app/features/AccessoryInstaller/types';
import { useValidations } from 'app/features/AccessoryInstaller/hooks/UseValidations.tsx';
import { useMemo } from 'react';
import ATCiLogo from 'app/features/AccessoryInstaller/Wizards/atc/assets/ATC_1.webp';
import SDImg from './assets/Step_02_Macro_Configuration_Insert_SD_Card.webp';
import ControllerConfigImg from './assets/Step_03_Controller_Configuration.webp';
import HomingImg from './assets/Step_04_Homing.webp';
import RackA from './assets/Step_5A_Rack_Position_06.webp';
// import RackB from './assets/Step_5B_Rack_Position_01.webp';
import TLSPosImg from './assets/Step_07_ToolLength_Sensor_Position.webp';
import PlaceholderImageFive from './assets/placeholder_TLS.png';
import CompletionImg from './assets/Step_10_Setup_Complete.webp';
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
import { ATCConfigStep } from 'app/features/AccessoryInstaller/Wizards/atc/components/ATCConfigStep.tsx';
import {
    TemplateManagementContextProvider,
    TemplateManagementSecondaryContent,
    TemplateManagementStep,
} from 'app/features/AccessoryInstaller/Wizards/atc/components/TemplateManagement.tsx';

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
            image: ATCiLogo,
            validations: [...validations],
            subWizards: [
                {
                    id: 'initial-setup',
                    title: 'Setup Wizard',
                    description: 'Configure your ATC for first time use',
                    estimatedTime: '30 minutes - 2 hours',
                    configVersion: storeVersion,
                    completionPage: ATCCompletion,
                    completionImage: CompletionImg,
                    steps: [
                        {
                            id: 'macro-configuration',
                            title: 'Tool Changing Macros',
                            component: MacroConfiguration,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: SDImg,
                                    title: 'SD Card Installation',
                                },
                            ],
                        },
                        {
                            id: 'controller-configuration',
                            title: 'Controller Setup',
                            component: ControllerConfiguration,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: ControllerConfigImg,
                                },
                            ],
                        },
                        {
                            id: 'rehome',
                            title: 'Rehome',
                            component: RestartAndRehome,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: HomingImg,
                                },
                            ],
                        },
                        {
                            id: 'rack-position',
                            title: 'Rack Position',
                            component: RackPosition,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: RackA,
                                },
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
                                    type: 'image',
                                    content: TLSPosImg,
                                },
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
                            title: 'Spindle Setup - Part 1',
                            component: SpindleSetRestart,
                            secondaryContent: [
                                {
                                    type: 'image',
                                    content: PlaceholderImageFive,
                                },
                            ],
                        },
                        {
                            id: 'modbus-config',
                            title: 'Spindle Setup - Part 2',
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
                            title: 'ATC Options',
                            component: ATCConfigStep,
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
                    ],
                },
                {
                    id: 'template-management',
                    title: 'Template Management',
                    description: 'Manage ATC template macros',
                    estimatedTime: '5 minutes',
                    configVersion: storeVersion,
                    secondaryContentLeft: true,
                    hideVersionPrintout: true,
                    steps: [
                        {
                            id: 'template-management',
                            title: 'Template Management',
                            component: TemplateManagementStep,
                            contextProvider: TemplateManagementContextProvider,
                            fillPrimaryContent: true,
                            secondaryContent: [
                                {
                                    type: 'component',
                                    content: TemplateManagementSecondaryContent,
                                    fill: true,
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
