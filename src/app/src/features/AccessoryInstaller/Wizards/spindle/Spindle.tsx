import {Wizard} from 'app/features/AccessoryInstaller/types';
import {useMemo} from "react";
import {useValidations} from "app/features/AccessoryInstaller/hooks/UseValidations.tsx";
import {SpindleConfig} from "app/features/AccessoryInstaller/Wizards/spindle/assets/SpindleConfig.tsx";
import {ControllerReboot} from "app/features/AccessoryInstaller/Wizards/spindle/assets/ControllerReboot.tsx";

export function useSienciSpindle() {
    const {connectionValidation} = useValidations();

    const validations = useMemo(
        () => [connectionValidation],
        [connectionValidation],
    );
    return useMemo<Wizard>(
        () => ({
            id: 'sienci-spindle',
            title: 'Sienci Spindle',
            validations: [...validations],
            subWizards: [{
                id: 'spindle-config',
                title: 'Sienci Spindle Config',
                description: 'Configure your Sienci Spindle for first time use',
                estimatedTime: '10 - 30 minutes',
                configVersion: '1.0',
                completionPage: null,
                steps: [
                    {
                        id: 'spindle-config',
                        title: 'Spindle Config',
                        component: SpindleConfig,
                        secondaryContent: []
                    },
                    {
                        id: 'modbus-config',
                        title: 'Modbus Configuration',
                        component: SpindleConfig,
                        secondaryContent: []
                    },
                    {
                        id: 'controller-reboot',
                        title: 'Reboot your controller',
                        component: ControllerReboot,
                        secondaryContent: []
                    },
                ]
            }]
        }), [validations]);
}