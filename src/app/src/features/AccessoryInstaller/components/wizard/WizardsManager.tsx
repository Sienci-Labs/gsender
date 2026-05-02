import { useState, useEffect, useRef } from 'react';
import { Wizard } from '../../types/wizard';
import { WizardsHub } from './WizardsHub';
import { WizardManager } from './WizardManager';

interface WizardsManagerProps {
    wizards: Wizard[];
    hubTitle?: string;
    hubDescription?: string;
    initialWizardId?: string;
    initialSubWizardId?: string;
}

export function WizardsManager({
    wizards,
    hubTitle,
    hubDescription,
    initialWizardId,
    initialSubWizardId,
}: WizardsManagerProps) {
    const [selectedWizard, setSelectedWizard] = useState<Wizard | null>(null);
    const hasAutoSelected = useRef(false);

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

    useEffect(() => {
        if (hasAutoSelected.current || !initialWizardId || !wizards.length) return;
        const match = wizards.find((w) => w.id === initialWizardId);
        if (match) {
            setSelectedWizard(match);
            hasAutoSelected.current = true;
        }
    }, [wizards, initialWizardId]);

    const handleSelectWizard = (wizard: Wizard) => {
        setSelectedWizard(wizard);
    };

    const handleExitWizard = () => {
        setSelectedWizard(null);
    };

    return (
        <div className="h-full min-h-0 overflow-hidden">
            {selectedWizard ? (
                <WizardManager
                    wizard={selectedWizard}
                    onExit={handleExitWizard}
                    initialSubWizardId={initialSubWizardId}
                />
            ) : (
                <WizardsHub
                    wizards={wizards}
                    onSelectWizard={handleSelectWizard}
                    title={hubTitle}
                    description={hubDescription}
                />
            )}
        </div>
    );
}
