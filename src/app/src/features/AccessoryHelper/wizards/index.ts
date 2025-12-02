import { Wizard } from 'app/features/AccessoryHelper/types/wizard.ts';
import { ATCSetupWizard } from 'app/features/AccessoryHelper/wizards/ATCSetupWizard.ts';
import { CLSMSetupWizard } from 'app/features/AccessoryHelper/wizards/CLSMSetupWizard.ts';
import { PlaceholderWizard } from 'app/features/AccessoryHelper/wizards/PlaceholderWizard.tsx';

export const MasterWizards: Wizard[] = [
    ATCSetupWizard,
    CLSMSetupWizard,
    PlaceholderWizard,
];
