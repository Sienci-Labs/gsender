import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';

export function RackPosition({ onComplete, onUncomplete }: StepProps) {
    const applySettings = async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
    };

    return (
        <div className="flex flex-col gap-5 p-2 justify-start">
            <p>I am a placeholder until more is implemented :)</p>
            <StepActionButton
                label="Probe Rack"
                runningLabel="Probing..."
                onApply={applySettings}
                onComplete={onComplete}
                onUncomplete={onUncomplete}
            />
        </div>
    );
}
