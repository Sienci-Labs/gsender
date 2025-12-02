import { Wizard } from 'app/features/AccessoryHelper/types/wizard.ts';
import ATCILogo from './assets/atci.png';

export const ATCSetupWizard: Wizard = {
    category: 'ATC',
    description: 'ATCi Setup and Configuration',
    estimatedTime: '30-60 minutes',
    id: 'atci',
    name: 'ATCi Setup',
    requiredItems: [],
    steps: [],
    thumbnail: ATCILogo,
};
