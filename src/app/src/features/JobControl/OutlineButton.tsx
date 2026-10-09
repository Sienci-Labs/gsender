import { usePostHog } from '@posthog/react';
import { Button } from 'app/components/shadcn/Button';
import { LASER_MODE } from 'app/constants';
import { toast } from 'app/lib/toaster';
import store from 'app/store';
import { store as reduxStore } from 'app/store/redux';
import { outlineResponse } from 'app/workers/Outline.response';
import cx from 'classnames';
import get from 'lodash/get';
import pubsub from 'pubsub-js';
import { TbVector } from 'react-icons/tb';

interface OutlineButtonProps {
    disabled: boolean;
}

let outlineRunning = false;

/**
 * Runs the outline for the loaded file. liteMode defaults to the
 * widgets.visualizer.liteMode setting; pass true to always use the outline
 * worker (no visualizer needed).
 */
export const runOutline = (
    posthog?: ReturnType<typeof usePostHog>,
    options: { liteMode?: boolean } = {},
) => {
    const liteMode =
        options.liteMode ?? store.get('widgets.visualizer.liteMode', false);
    if (liteMode) {
        // lightweight mode
        if (outlineRunning) {
            return;
        }
        let maxRuntime: ReturnType<typeof setTimeout> | undefined;
        try {
            const outlineWorker = new Worker(
                new URL('app/workers/Outline.worker.js', import.meta.url),
                { type: 'module' },
            );
            const bbox = get(reduxStore.getState(), 'file.bbox');
            const laserOnOutline = store.get(
                'widgets.spindle.laser.laserOnOutline',
                false,
            );
            const spindleMode = store.get('widgets.spindle.mode');
            const isLaser = laserOnOutline && spindleMode === LASER_MODE;
            const outlineSpeed = store.get('workspace.outlineSpeed', null);

            maxRuntime = setTimeout(() => {
                outlineWorker.terminate();
                toast.error('Outline generation timed out. Please try again.');
                outlineRunning = false;
            }, 15000);

            outlineWorker.onmessage = ({ data }) => {
                clearTimeout(maxRuntime);
                outlineResponse({ data });
                // Enable the outline button again
                outlineRunning = false;
            };
            // A worker that fails to load or throws never posts back; report
            // it now instead of letting it surface as the 15 s timeout.
            const onWorkerError = (event: Event) => {
                clearTimeout(maxRuntime);
                outlineWorker.terminate();
                console.error('Outline worker failed', event);
                toast.error('Outline generation failed. Please try again.');
                outlineRunning = false;
            };
            outlineWorker.onerror = onWorkerError;
            outlineWorker.onmessageerror = onWorkerError;
            outlineWorker.postMessage({
                isLaser,
                parsedData: [],
                mode: 'Square',
                bbox: bbox,
                outlineSpeed,
            });

            posthog?.capture('outline_run', {
                is_in_lite_mode: liteMode,
                is_laser: isLaser,
                outline_speed: outlineSpeed,
                bbox,
            });
        } catch (e) {
            clearTimeout(maxRuntime);
            console.log(e);
        }
    } else {
        pubsub.publish('outline:start');
    }
};

const OutlineButton: React.FC<OutlineButtonProps> = ({ disabled }) => {
    const posthog = usePostHog();

    return (
        <Button
            disabled={disabled}
            className={cx(
                'rounded-[0.2rem] border-solid border-2 text-base px-3 portrait:px-6 portrait:text-lg',
                {
                    'border-blue-600 bg-blue-600 text-white [box-shadow:_2px_2px_5px_0px_var(--tw-shadow-color)] shadow-gray-400':
                        !disabled,
                    'border-gray-500 bg-gray-400': disabled,
                },
            )}
            onClick={() => runOutline(posthog)}
        >
            <TbVector className="text-2xl mr-1" /> Outline
        </Button>
    );
};

export default OutlineButton;
