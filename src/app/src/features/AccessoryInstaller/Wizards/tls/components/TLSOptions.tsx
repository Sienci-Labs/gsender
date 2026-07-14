import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { useState } from 'react';
import store from 'app/store';
import { FirstToolBehavior } from 'app/workspace/definitions';
import { updateToolchangeContext } from 'app/features/Helper/Wizard.tsx';
import pubsub from 'pubsub-js';

const FIRST_TOOL_BEHAVIOUR_OPTIONS: FirstToolBehavior[] = [
    'Always run full wizard',
    'Prompt for first tool',
    'Always probe length only',
];

const FIRST_TOOL_BEHAVIOUR_EXPLANATIONS: Record<FirstToolBehavior, string> = {
    'Always run full wizard':
        'Runs the complete tool change process every time, including for the first tool.',
    'Prompt for first tool':
        'Asks whether to run the full wizard or just probe the current tool length for the first tool change.',
    'Always probe length only':
        'Skips the tool change prompt and only measures the current tool for the first tool change.',
};

export function TLSOptions({ onComplete, onUncomplete }: StepProps) {
    const [error, setError] = useState<string>('');
    const [isComplete, setIsComplete] = useState<boolean>(false);

    const [customLocation, setCustomLocation] = useState<boolean>(true);
    const [firstToolBehaviour, setFirstToolBehaviour] =
        useState<FirstToolBehavior>('Prompt for first tool');

    const applySettings = async () => {
        store.set('workspace.toolChangeOption', 'Fixed Tool Sensor');
        store.set(
            'workspace.toolChange.moveToManualPosition',
            customLocation,
        );
        store.set(
            'workspace.toolChange.firstToolBehaviour',
            firstToolBehaviour,
        );
        store.set('workspace.toolChange.passthrough', false);
        updateToolchangeContext();
        pubsub.publish('repopulate');
        setIsComplete(true);
        onComplete();
    };

    return (
        <div className="flex flex-col gap-5 justify-start">
            <p className="dark:text-white">
                Configure how gSender should handle tool changes with your
                Tool Length Sensor (TLS).
            </p>

            <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    First tool behaviour
                </label>
                <select
                    value={firstToolBehaviour}
                    onChange={(e) =>
                        setFirstToolBehaviour(
                            e.target.value as FirstToolBehavior,
                        )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {FIRST_TOOL_BEHAVIOUR_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    {FIRST_TOOL_BEHAVIOUR_EXPLANATIONS[firstToolBehaviour]}
                </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={customLocation}
                    onChange={(e) => setCustomLocation(e.target.checked)}
                    className="w-6 h-6 mt-0.5 shrink-0 rounded-md border-2 border-gray-300 accent-blue-500 cursor-pointer transition-colors hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                <span>
                    <span className="block text-lg font-semibold text-gray-900 dark:text-white">
                        Set custom tool change location
                    </span>
                    <span className="block text-sm text-gray-600 dark:text-gray-300">
                        Move the CNC to a more convenient location for manual
                        tool changes instead of prompting to change over the
                        sensor.
                    </span>
                </span>
            </label>

            <p className="dark:text-white">
                Select <b>"Apply"</b> to set your tool change strategy to
                Fixed Tool Sensor and save these options.
            </p>
            <StepActionButton
                label={'Apply'}
                runningLabel="Applying..."
                onApply={applySettings}
                isComplete={isComplete}
                error={error}
            />
        </div>
    );
}
