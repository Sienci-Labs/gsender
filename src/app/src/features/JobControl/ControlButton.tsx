import { useEffect, useState } from 'react';
import cx from 'classnames';
import includes from 'lodash/includes';
import pubsub from 'pubsub-js';
import { PiPause } from 'react-icons/pi';
import { FiOctagon } from 'react-icons/fi';
import { IoPlayOutline } from 'react-icons/io5';

import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { WORKFLOW_STATES_T } from 'app/store/definitions';
import controller from 'app/lib/controller';
import {
    CARVING_CATEGORY,
    GRBL,
    GRBL_ACTIVE_STATE_CHECK,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    GRBL_ACTIVE_STATE_RUN,
    GRBLHAL,
    MACHINE_CONTROL_BUTTONS,
    PAUSE,
    START,
    STOP,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
    WORKFLOW_STATE_RUNNING,
} from '../../constants';
import get from 'lodash/get';
import reduxStore from 'app/store/redux';

type MACHINE_CONTROL_BUTTONS_T =
    (typeof MACHINE_CONTROL_BUTTONS)[keyof typeof MACHINE_CONTROL_BUTTONS];

interface ControlButtonProps {
    type: MACHINE_CONTROL_BUTTONS_T;
    workflow: { state: WORKFLOW_STATES_T };
    activeState: GRBL_ACTIVE_STATES_T;
    isConnected: boolean;
    fileLoaded: boolean;
    onStop: () => void;
}

interface Message {
    [key: MACHINE_CONTROL_BUTTONS_T]: string;
}

interface Icons {
    [key: MACHINE_CONTROL_BUTTONS_T]: React.ReactNode;
}

interface OnClick {
    [key: MACHINE_CONTROL_BUTTONS_T]: () => void;
}

const ControlButton: React.FC<ControlButtonProps> = ({
    type,
    workflow,
    activeState,
    isConnected,
    fileLoaded,
    onStop,
}) => {
    function canRun(reduxActiveState?: GRBL_ACTIVE_STATES_T) {
        const currentActiveState = reduxActiveState || activeState;
        return (
            currentActiveState === GRBL_ACTIVE_STATE_IDLE ||
            currentActiveState === GRBL_ACTIVE_STATE_HOLD
        );
    }

    function canPause(
        reduxActiveState?: GRBL_ACTIVE_STATES_T,
        reduxWorkflow?: { state: WORKFLOW_STATES_T },
    ) {
        const currentActiveState = reduxActiveState || activeState;
        const currentWorkflow = reduxWorkflow || workflow;
        const { state } = currentWorkflow;

        return (
            includes([WORKFLOW_STATE_RUNNING, WORKFLOW_STATE_PAUSED], state) &&
            (currentActiveState === GRBL_ACTIVE_STATE_RUN ||
                currentActiveState === GRBL_ACTIVE_STATE_HOLD)
        );
    }

    function canStop(reduxWorkflow?: { state: WORKFLOW_STATES_T }) {
        const currentWorkflow = reduxWorkflow || workflow;
        const { state } = currentWorkflow;
        return includes([WORKFLOW_STATE_RUNNING, WORKFLOW_STATE_PAUSED], state);
    }

    const isDisabled = (): boolean => {
        if (!isConnected || !fileLoaded) {
            return true;
        } else if (
            (type === START && canRun()) ||
            (type === PAUSE && canPause()) ||
            (type === STOP && canStop())
        ) {
            return false;
        }
        return true;
    };

    const shortcutIsDisabled = () => {
        const isConnected = get(
            reduxStore.getState(),
            'connection.isConnected',
        );
        const fileLoaded = get(reduxStore.getState(), 'file.fileLoaded');
        const activeState = get(
            reduxStore.getState(),
            'controller.state.status.activeState',
        );
        const workflow = get(reduxStore.getState(), 'controller.workflow');

        if (!isConnected || !fileLoaded) {
            return true;
        } else if (
            (type === START && canRun(activeState)) ||
            (type === PAUSE && canPause(activeState, workflow)) ||
            (type === STOP && canStop(workflow))
        ) {
            return false;
        }
        return true;
    };

    const [disabled, setDisabled] = useState(isDisabled());

    useEffect(() => {
        setDisabled(isDisabled());
    });

    // only include the shortcut for the current button
    // it doesn't matter where runOutline goes, so I just put it with the start button
    const getShuttleEvent = () => {
        switch (type) {
            case 'START':
                return {
                    START_JOB: {
                        title: 'Start job',
                        keys: '~',
                        gamepadKeys: '9',
                        keysName: 'Start',
                        cmd: 'START_JOB',
                        payload: {
                            type: GRBL,
                        },
                        preventDefault: true,
                        isActive: true,
                        category: CARVING_CATEGORY,
                        callback: () => {
                            const activeState = get(
                                reduxStore.getState(),
                                'controller.state.status.activeState',
                            );
                            const workflow = get(
                                reduxStore.getState(),
                                'controller.workflow',
                            );

                            if (shortcutIsDisabled()) {
                                return;
                            }
                            handleRun(activeState, workflow);
                        },
                    },
                    RUN_OUTLINE: {
                        title: 'Run outline',
                        preventDefault: false,
                        isActive: true,
                        category: CARVING_CATEGORY,
                        keys: '',
                        cmd: 'RUN_OUTLINE',
                        callback: () => {
                            if (shortcutIsDisabled()) {
                                return;
                            }
                            pubsub.publish('outline:start');
                        },
                    },
                };
            case 'PAUSE':
                return {
                    PAUSE_JOB: {
                        title: 'Pause job',
                        keys: '!',
                        gamepadKeys: '2',
                        keysName: 'X',
                        cmd: 'PAUSE_JOB',
                        payload: {
                            type: GRBL,
                        },
                        preventDefault: true,
                        isActive: true,
                        category: CARVING_CATEGORY,
                        callback: () => {
                            if (shortcutIsDisabled()) {
                                return;
                            }
                            handlePause();
                        },
                    },
                };
            case 'STOP':
                return {
                    STOP_JOB: {
                        title: 'Global Stop',
                        keys: '@',
                        gamepadKeys: '3',
                        keysName: 'Y',
                        cmd: 'STOP_JOB',
                        preventDefault: true,
                        isActive: true,
                        category: CARVING_CATEGORY,
                        callback: () => {
                            const activeState = get(
                                reduxStore.getState(),
                                'controller.state.status.activeState',
                            );
                            const firmwareType = get(
                                reduxStore.getState(),
                                'controller.type',
                            );
                            // if shortcut is disabled (aka job isnt running) it works as a jog stop shortcut
                            if (shortcutIsDisabled()) {
                                if (activeState === GRBL_ACTIVE_STATE_JOG) {
                                    return controller.command('jog:cancel');
                                }
                                if (activeState === GRBL_ACTIVE_STATE_IDLE) {
                                    return;
                                }
                                if (firmwareType === GRBLHAL) {
                                    return controller.command('reset:soft');
                                }
                                controller.command('reset');
                                return;
                            }
                            handleStop(activeState);
                        },
                    },
                };
        }
    };

    const shuttleControlEvents = getShuttleEvent();

    useShuttleEvents(shuttleControlEvents);
    useEffect(() => {
        useKeybinding(shuttleControlEvents);
    }, []);

    const handleRun = (
        reduxActiveState?: GRBL_ACTIVE_STATES_T,
        reduxWorkflow?: { state: WORKFLOW_STATES_T },
    ): void => {
        const currentActiveState = reduxActiveState || activeState;
        const currentWorkflow = reduxWorkflow || workflow;
        const { state } = currentWorkflow;

        console.assert(
            includes([WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED], state) ||
                currentActiveState === GRBL_ACTIVE_STATE_HOLD,
        );

        if (
            state === WORKFLOW_STATE_PAUSED ||
            currentActiveState === GRBL_ACTIVE_STATE_HOLD
        ) {
            controller.command('gcode:resume');
            return;
        }

        if (state === WORKFLOW_STATE_IDLE) {
            controller.command('gcode:start');
            return;
        }
    };
    const handlePause = (): void => {
        controller.command('gcode:pause');
    };
    const handleStop = (reduxActiveState?: GRBL_ACTIVE_STATES_T): void => {
        const currentActiveState = reduxActiveState || activeState;
        onStop();
        controller.command('gcode:stop', { force: true });
        if (currentActiveState === GRBL_ACTIVE_STATE_CHECK) {
            controller.command('gcode', '$C');
        }
    };

    const message: Message = {
        START: 'Start',
        PAUSE: 'Pause',
        STOP: 'Stop',
    };

    const icons: Icons = {
        START: <IoPlayOutline className="text-4xl" />,
        PAUSE: <PiPause className="text-3xl" />,
        STOP: <FiOctagon className="text-3xl" />,
    };

    const onClick: OnClick = {
        START: handleRun,
        PAUSE: handlePause,
        STOP: handleStop,
    };

    return (
        <div className="flex justify-center items-center">
            <button
                type="button"
                className={cx(
                    'grid grid-cols-[1fr_2fr] gap-[1px] items-center portrait:h-12 h-12 max-xl:h-9 w-24 max-xl:w-22 px-2 text-base rounded border-solid border-gray-600 duration-150 ease-in-out',
                    '[box-shadow:_0.4px_0.4px_2px_2px_var(--tw-shadow-color)] shadow-gray-500',
                    {
                        'bg-gray-300 text-gray-600 dark:bg-dark dark:text-gray-400 cursor-not-allowed':
                            disabled,
                        'bg-green-600 dark:bg-green-700 text-white':
                            !disabled && type === START,
                        'bg-orange-400 dark:bg-orange-700 text-white':
                            !disabled && type === PAUSE,
                        'bg-red-500 dark:bg-red-700 text-white':
                            !disabled && type === STOP,
                    },
                )}
                onClick={onClick[type]}
                disabled={disabled}
            >
                {icons[type]}
                {message[type]}
            </button>
        </div>
    );
};

export default ControlButton;
