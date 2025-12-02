import { Wizard } from 'app/features/AccessoryHelper/types/wizard.ts';
import CLSMLogo from './assets/clsm.jpg';

export const CLSMSetupWizard: Wizard = {
    category: 'LongMill',
    description: 'Upgrade your machine to Closed-Loop Stepper Motors',
    estimatedTime: '30 minutes - 2 hours',
    id: 'CLSM',
    name: 'Closed-Loop Stepper Motors',
    requiredItems: [],
    steps: [],
    thumbnail: CLSMLogo,
};
