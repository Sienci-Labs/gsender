import { useState, useEffect, useRef } from 'react';
import { Wizard, SubWizard } from '../../types/wizard';
import { WizardLanding } from './WizardLanding';
import { WizardContainer } from './WizardContainer';

interface WizardManagerProps {
    wizard: Wizard;
    onExit?: () => void;
    initialSubWizardId?: string;
}

export function WizardManager({ wizard, onExit, initialSubWizardId }: WizardManagerProps) {
    const [selectedSubWizard, setSelectedSubWizard] =
        useState<SubWizard | null>(null);
    const hasAutoSelected = useRef(false);

    useEffect(() => {
        if (wizard.subWizards.length === 1) {
            const allValid =
                !wizard.validations.length ||
                wizard.validations.every((v) => v().success);
            if (allValid) {
                setSelectedSubWizard(wizard.subWizards[0]);
            }
        }
    }, [wizard]);

    useEffect(() => {
        if (hasAutoSelected.current || !initialSubWizardId || !wizard.subWizards.length) return;
        const match = wizard.subWizards.find((sw) => sw.id === initialSubWizardId);
        if (match) {
            setSelectedSubWizard(match);
            hasAutoSelected.current = true;
        }
    }, [wizard, initialSubWizardId]);

    const handleSelectSubWizard = (subWizard: SubWizard) => {
        setSelectedSubWizard(subWizard);
    };

    const handleExitWizard = () => {
        setSelectedSubWizard(null);
    };

    return (
        <div className="h-full min-h-0 overflow-hidden">
            {selectedSubWizard ? (
                <WizardContainer
                    subWizard={selectedSubWizard}
                    onExit={handleExitWizard}
                />
            ) : (
                <WizardLanding
                    title={wizard.title}
                    image={wizard.image}
                    subWizards={wizard.subWizards}
                    onSelectSubWizard={handleSelectSubWizard}
                    onBack={onExit}
                    validations={wizard.validations}
                    helpUrl={wizard.helpUrl}
                />
            )}
        </div>
    );
}
