import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';

export function TLSPosition({ onComplete, onUncomplete }: StepProps) {
    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
    };

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <p>I am a placeholder until more is implemented :)</p>
            <StepActionButton
                label="Set Position"
                runningLabel="Setting..."
                onApply={applySettings}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
            />
        </div>
    );
}
