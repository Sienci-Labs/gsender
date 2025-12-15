import { WizardsManager } from 'app/features/AccessoryInstaller/components/wizard';
import { useAllWizards } from 'app/features/AccessoryInstaller/Wizards';

export function AccessoryInstaller() {
    const wizards = useAllWizards();
    return (
        <WizardsManager
            wizards={wizards}
            hubTitle="Accessory Installation"
            hubDescription="Select a wizard to configure and install your CNC accessories. Each wizard will guide you through the setup process step by step."
        />
    );
}
