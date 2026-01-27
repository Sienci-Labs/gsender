import { StepProps } from 'app/features/AccessoryInstaller/types';
import { StepActionButton } from 'app/features/AccessoryInstaller/components/wizard/StepActionButton.tsx';
import { useEffect, useState } from 'react';
import { generateAllMacros } from 'app/features/ATC/components/Configuration/utils/ConfigUtils.ts';
import controller from 'app/lib/controller.ts';
import store from 'app/store';

export function MacroConfiguration({ onComplete, onUncomplete }: StepProps) {
    const [rackSize, setRackSize] = useState<number>(6);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        controller.addListener('ymodem:complete', () => {
            setIsComplete(true);
            setError(false);
            onComplete();
            setTimeout(() => {
                setIsComplete(false);
            }, 2000);
        });
        controller.addListener('ymodem:error', (err) => {
            setError(err);
            setTimeout(() => {
                setIsComplete(false);
                setError(null);
            }, 5000);
        });
        return () => {
            controller.removeListener('ymodem:complete');
            controller.removeListener('ymodem:error');
        };
    }, []);

    const handleUpload = async () => {
        if (rackSize === '0') {
            store.set(
                'widgets.atc.templates.variables._tc_rack_enable.value',
                0,
            );
            store.set('widgets.atc.templates.variables._tc_slots.value', 0);
        } else {
            // just set tool rack size to valid number, do we need to set TOOL_RACK = 1?
            // No reason not to
            store.set(
                'widgets.atc.templates.variables._tc_rack_enable.value',
                1,
            );
            store.set(
                'widgets.atc.templates.variables._tc_slots.value',
                Number(rackSize),
            );
        }

        // start macros copying over
        const config = store.get('widgets.atc.templates');
        const content = generateAllMacros(config);

        controller.command('ymodem:uploadFiles', content);
        //await new Promise((resolve) => setTimeout(resolve, 2000));
    };

    return (
        <div className="flex flex-col gap-5 justify-start">
            <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-400 mb-2">
                    Rack Size
                </label>
                <select
                    value={rackSize}
                    onChange={(e) => setRackSize(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value={0}>No tool rack</option>
                    <option value={6}>6 Tool Rack</option>
                    <option value={12}>12 Tool Rack</option>
                </select>
            </div>
            <p className="dark:text-white">
                Sienci ATC operates using a set of macro programs stored in the
                micro SD card of your controller.
            </p>

            <p className="dark:text-white">
                Specify your rack size and click “Upload Macros” to upload the
                relevant program files into the SD card. This can be changed
                later.
            </p>

            <StepActionButton
                label={'Upload'}
                runningLabel="Uploading..."
                onApply={handleUpload}
                isComplete={isComplete}
                error={error}
            />
        </div>
    );
}
