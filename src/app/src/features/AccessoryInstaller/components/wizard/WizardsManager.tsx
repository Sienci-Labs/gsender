import { useState, useEffect } from 'react';
import { Wizard } from '../../types/wizard';
import { WizardsHub } from './WizardsHub';
import { WizardManager } from './WizardManager';

interface WizardsManagerProps {
    wizards: Wizard[];
    hubTitle?: string;
    hubDescription?: string;
}

export function WizardsManager({
    wizards,
    hubTitle,
    hubDescription,
}: WizardsManagerProps) {
    const [selectedWizard, setSelectedWizard] = useState<Wizard | null>(null);

    useEffect(() => {
        if (selectedWizard) {
            const updatedWizard = wizards.find(
                (w) => w.id === selectedWizard.id,
            );
            if (updatedWizard && updatedWizard !== selectedWizard) {
                setSelectedWizard(updatedWizard);
            }
        }
    }, [wizards, selectedWizard]);

    const handleSelectWizard = (wizard: Wizard) => {
        setSelectedWizard(wizard);
    };

    const handleExitWizard = () => {
        setSelectedWizard(null);
    };

    if (selectedWizard) {
        return (
            <WizardManager wizard={selectedWizard} onExit={handleExitWizard} />
        );
    }

    return (
        <WizardsHub
            wizards={wizards}
            onSelectWizard={handleSelectWizard}
            title={hubTitle}
            description={hubDescription}
        />
    );
}
