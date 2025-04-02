import { useState } from 'react';
import cx from 'classnames';
import { Button as ShadButton } from 'app/components/shadcn/Button';
import { Button } from 'app/components/Button';
import { MdFormatListNumbered } from 'react-icons/md';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import store from 'app/store';
import { METRIC_UNITS, IMPERIAL_UNITS } from 'app/constants';
import { updateJobOverrides } from 'app/store/redux/slices/visualizer.slice';
import controller from 'app/lib/controller';
import { store as reduxStore } from 'app/store/redux';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from 'app/components/shadcn/Dialog';
import Tooltip from 'app/components/Tooltip';
import { Input } from 'app/components/Input';
import { FaPlay } from 'react-icons/fa';
import { toast } from 'app/lib/toaster';

type StartFromLineProps = {
    disabled: boolean;
    lastLine: number;
};

const StartFromLine = ({ disabled, lastLine }: StartFromLineProps) => {
    const zMax = useTypedSelector((state) => state.file.bbox.max.z);
    const [state, setState] = useState({
        showModal: false,
        needsRecovery: false,
        value: lastLine,
        waitForHoming: false,
        safeHeight:
            store.get('workspace.units', METRIC_UNITS) === METRIC_UNITS
                ? 10
                : 0.4,
        defaultSafeHeight:
            store.get('workspace.units', METRIC_UNITS) === METRIC_UNITS
                ? 10
                : 0.4,
    });

    const handleStartFromLine = () => {
        const { safeHeight, value } = state;
        const units = store.get('workspace.units', METRIC_UNITS);

        setState((prev) => ({
            ...prev,
            showModal: false,
            needsRecovery: false,
        }));

        const newSafeHeight =
            units === IMPERIAL_UNITS ? safeHeight * 25.4 : safeHeight;
        controller.command('gcode:start', value, zMax, newSafeHeight);
        reduxStore.dispatch(
            updateJobOverrides({ isChecked: true, toggleStatus: 'overrides' }),
        );
        toast.info('Running Start From Specific Line Command');
    };

    return (
        <>
            <ShadButton
                disabled={disabled}
                className={cx(
                    'rounded-[0.2rem] border-solid border-2 text-base px-2',
                    {
                        'border-blue-400 bg-white dark:bg-dark dark:text-gray-300 [box-shadow:_2px_2px_5px_0px_var(--tw-shadow-color)] shadow-gray-400':
                            !disabled,
                        'border-gray-500 bg-gray-400 dark:bg-dark dark:text-gray-400':
                            disabled,
                    },
                )}
                onClick={() =>
                    setState((prev) => ({ ...prev, showModal: true }))
                }
            >
                <MdFormatListNumbered className="text-2xl mr-1" /> Start From
            </ShadButton>
            <Dialog
                open={state.showModal}
                onOpenChange={() =>
                    setState((prev) => ({ ...prev, showModal: false }))
                }
            >
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>
                            {state.needsRecovery
                                ? 'Recovery: Start From Line'
                                : 'Start From Line'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="">
                        <div className="mb-4">
                            <p className="mb-2">
                                Recover a carve disrupted by power loss,
                                disconnection, mechanical malfunction, or other
                                failures
                            </p>
                            <p className="mb-0 text-black dark:text-white">
                                Your job was last stopped around line:{' '}
                                <b>{state.value}</b> on a g-code file with a
                                total of <b>{/* lineTotal */}</b> lines
                            </p>
                            {state.value > 0 && (
                                <p>
                                    Recommended starting lines:{' '}
                                    <strong>
                                        {state.value - 10 >= 0
                                            ? state.value - 10
                                            : 0}
                                    </strong>{' '}
                                    - <strong>{state.value}</strong>
                                </p>
                            )}
                        </div>
                        <div className="mb-4">
                            <div className="grid grid-cols-4 gap-2 items-center">
                                <label htmlFor="resumeJobLine">
                                    Resume job at line:
                                </label>
                                <Input
                                    id="resumeJobLine"
                                    type="number"
                                    value={state.value}
                                    onChange={(e) => {
                                        const newValue = Number(e.target.value);
                                        if (
                                            newValue >=
                                            0 /* && newValue <= lineTotal */
                                        ) {
                                            setState((prev) => ({
                                                ...prev,
                                                value: Math.ceil(newValue),
                                            }));
                                        }
                                    }}
                                    // max={lineTotal}
                                    min={0}
                                    className="w-20"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="grid grid-cols-4 gap-2 items-center">
                                <label htmlFor="safeHeight">
                                    With Safe Height:
                                </label>
                                <Tooltip
                                    content={`Default Value: ${state.defaultSafeHeight}`}
                                >
                                    <Input
                                        id="safeHeight"
                                        type="number"
                                        value={state.safeHeight}
                                        onChange={(e) => {
                                            setState((prev) => ({
                                                ...prev,
                                                safeHeight: Number(
                                                    e.target.value,
                                                ),
                                            }));
                                        }}
                                        className="w-20"
                                    />
                                </Tooltip>
                                <span className="text-sm col-span-2">
                                    (Safe Height is the value above Z max)
                                </span>
                            </div>
                        </div>
                        <div className="mb-4">
                            <p className="text-[#E2943B]">
                                Accounts for all past CNC movements, units,
                                spindle speeds, laser power, Start/Stop g-code,
                                and any other file modals or setup.
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <Button
                                onClick={handleStartFromLine}
                                // disabled={!isConnected}
                                className="flex flex-row p-3 items-center"
                            >
                                <span>Start from Line</span>
                                <FaPlay className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default StartFromLine;
