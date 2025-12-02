import { Wizard } from 'app/features/AccessoryHelper/types/wizard.ts';
import ATCILogo from './assets/atci.png';

export const ATCSetupWizard: Wizard = {
    category: 'AltMill',
    description:
        'Guidance through the ATCi Setup and initial configuration process',
    estimatedTime: '30-60 minutes',
    id: 'atci',
    name: 'ATCi Setup',
    requiredItems: [],
    steps: [],
    thumbnail: ATCILogo,
};
