import { Wizard } from 'app/features/AccessoryHelper/types/wizard.ts';
import { ATCSetupWizard } from 'app/features/AccessoryHelper/wizards/ATCSetupWizard.ts';
import { CLSMSetupWizard } from 'app/features/AccessoryHelper/wizards/CLSMSetupWizard.ts';

export const MasterWizards: Wizard[] = [ATCSetupWizard, CLSMSetupWizard];
