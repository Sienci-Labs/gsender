import { useState, useEffect } from 'react';
import { Wizard, SubWizard } from '../../types/wizard';
import { WizardLanding } from './WizardLanding';
import { WizardContainer } from './WizardContainer';

interface WizardManagerProps {
    wizard: Wizard;
    onExit?: () => void;
}

export function WizardManager({ wizard, onExit }: WizardManagerProps) {
    const [selectedSubWizard, setSelectedSubWizard] =
        useState<SubWizard | null>(null);

    useEffect(() => {
        if (wizard.subWizards.length === 1) {
            setSelectedSubWizard(wizard.subWizards[0]);
        }
    }, [wizard]);

    const handleSelectSubWizard = (subWizard: SubWizard) => {
        setSelectedSubWizard(subWizard);
    };

    const handleExitWizard = () => {
        setSelectedSubWizard(null);
        if (onExit) {
            onExit();
        }
    };

    if (selectedSubWizard) {
        return (
            <WizardContainer
                subWizard={selectedSubWizard}
                onExit={handleExitWizard}
            />
        );
    }

    return (
        <WizardLanding
            title={wizard.title}
            subWizards={wizard.subWizards}
            onSelectSubWizard={handleSelectSubWizard}
            onBack={onExit}
        />
    );
}
