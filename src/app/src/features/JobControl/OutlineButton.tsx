import cx from 'classnames';
import { Button } from 'app/components/shadcn/Button';
import { TbVector } from 'react-icons/tb';
import pubsub from 'pubsub-js';
import store from 'app/store';
import { LASER_MODE } from 'app/constants';
import { outlineResponse } from 'app/workers/Outline.response';
import { toast } from 'app/lib/toaster';
import { store as reduxStore } from 'app/store/redux';
import { get } from 'lodash';

interface OutlineButtonProps {
    disabled: boolean;
}

let outlineRunning = false;

const OutlineButton: React.FC<OutlineButtonProps> = ({ disabled }) => {
    // TODO
    const runOutline = () => {
        const liteMode = store.get('widgets.visualizer.liteMode', false);
        if (liteMode) {
            // lightweight mode
            if (outlineRunning) {
                return;
            }
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

                const maxRuntime = setTimeout(() => {
                    outlineWorker.terminate();
                    toast.error(
                        'Outline generation timed out. Please try again.',
                    );
                    outlineRunning = false;
                }, 15000);

                outlineWorker.onmessage = ({ data }) => {
                    clearTimeout(maxRuntime);
                    outlineResponse({ data });
                    // Enable the outline button again
                    outlineRunning = false;
                };
                outlineWorker.postMessage({
                    isLaser,
                    parsedData: [],
                    mode: 'Square',
                    bbox: bbox,
                });
            } catch (e) {
                console.log(e);
            }
        } else {
            pubsub.publish('outline:start');
        }
    };

    return (
        <Button
            disabled={disabled}
            className={cx(
                'rounded-[0.2rem] border-solid border-2 text-base px-3',
                {
                    'border-blue-500 bg-blue-500 text-white [box-shadow:_2px_2px_5px_0px_var(--tw-shadow-color)] shadow-gray-400':
                        !disabled,
                    'border-gray-500 bg-gray-400': disabled,
                },
            )}
            onClick={runOutline}
        >
            <TbVector className="text-2xl mr-1" /> Outline
        </Button>
    );
};

export default OutlineButton;
