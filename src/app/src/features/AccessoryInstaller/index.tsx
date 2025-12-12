import { WizardsManager } from 'app/features/AccessoryInstaller/components/wizard';

export function AccessoryInstaller() {
    return (
        <WizardsManager
            wizards={[]}
            hubTitle="Accessory Installation"
            hubDescription="Select a wizard to configure and install your CNC accessories. Each wizard will guide you through the setup process step by step."
        />
    );
}
