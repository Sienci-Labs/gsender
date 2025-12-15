import { WizardsManager } from 'app/features/AccessoryInstaller/components/wizard';
import { allWizards } from 'app/features/AccessoryInstaller/Wizards';

export function AccessoryInstaller() {
    return (
        <WizardsManager
            wizards={allWizards}
            hubTitle="Accessory Installation"
            hubDescription="Select a wizard to configure and install your CNC accessories. Each wizard will guide you through the setup process step by step."
        />
    );
}
