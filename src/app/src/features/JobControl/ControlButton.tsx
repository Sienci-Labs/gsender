import {
    CARVING_CATEGORY,
    GRBL,
    GRBL_ACTIVE_STATE_ALARM,
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_RUN,
    MACHINE_CONTROL_BUTTONS,
    PAUSE,
    START,
    STOP,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED,
} from '../../constants';
import controller from 'app/lib/controller';
import cx from 'classnames';
import includes from 'lodash/includes';
import { GRBL_ACTIVE_STATES_T } from 'app/definitions/general';
import { WORKFLOW_STATES_T } from 'app/store/definitions';
import { PiPause } from 'react-icons/pi';
import { FiOctagon } from 'react-icons/fi';
import { IoPlayOutline } from 'react-icons/io5';
import { useEffect, useState } from 'react';
import { useRegisterShortcut } from '../Keyboard/useRegisterShortcut';
import useKeybinding from 'app/lib/useKeybinding';
import combokeys from 'app/lib/combokeys';

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
    [key: MACHINE_CONTROL_BUTTONS_T]: JSX.Element;
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
    const isDisabled = (): boolean => {
        if (!isConnected || !fileLoaded) {
            return true;
        } else if (
            (type === START &&
                (activeState === GRBL_ACTIVE_STATE_IDLE ||
                    activeState === GRBL_ACTIVE_STATE_HOLD)) ||
            (type === PAUSE &&
                (activeState === GRBL_ACTIVE_STATE_RUN ||
                    activeState === GRBL_ACTIVE_STATE_HOLD)) ||
            (type === STOP &&
                (activeState === GRBL_ACTIVE_STATE_RUN ||
                    activeState === GRBL_ACTIVE_STATE_HOLD ||
                    activeState === GRBL_ACTIVE_STATE_ALARM))
        ) {
            return false;
        }
        return true;
    };

    const [disabled, setDisabled] = useState(isDisabled());

    useEffect(() => {
        setDisabled(isDisabled());
    });

    useEffect(() => {
        addShuttleControlEvents();
        return () => {
            removeShuttleControlEvents();
        };
    }, []);

    const addShuttleControlEvents = () => {
        Object.keys(shuttleControlEvents).forEach((eventName) => {
            const callback = shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });
    };

    const removeShuttleControlEvents = () => {
        Object.keys(shuttleControlEvents).forEach((eventName) => {
            const callback = shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });
    };

    useRegisterShortcut({
        id: 'start-job',
        description: 'Start a job',
        defaultKeys: '~',
        category: 'CARVING_CATEGORY',
        onKeyDown: () => {
            handleRun();
        },
    });

    useRegisterShortcut({
        id: 'pause-job',
        description: 'Pause a job',
        defaultKeys: '~',
        category: 'CARVING_CATEGORY',
        onKeyDown: () => {
            handlePause();
        },
    });

    useRegisterShortcut({
        id: 'stop-job',
        description: 'Stop a job',
        defaultKeys: '~',
        category: 'CARVING_CATEGORY',
        onKeyDown: () => {
            handleStop();
        },
    });

    const shuttleControlEvents = {
        START_JOB: {
            title: 'Start Job',
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
                console.log('START_JOB');
                handleRun();
            },
        },
        PAUSE_JOB: {
            title: 'Pause Job',
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
                handlePause();
            },
        },
        STOP_JOB: {
            title: 'Stop Job',
            keys: '@',
            gamepadKeys: '3',
            keysName: 'Y',
            cmd: 'STOP_JOB',
            preventDefault: true,
            isActive: true,
            category: CARVING_CATEGORY,
            callback: () => {
                handleStop();
            },
        },
    };

    useKeybinding(shuttleControlEvents);

    const handleRun = (): void => {
        console.assert(
            includes(
                [WORKFLOW_STATE_IDLE, WORKFLOW_STATE_PAUSED],
                workflow.state,
            ) || activeState === GRBL_ACTIVE_STATE_HOLD,
        );

        if (workflow.state === WORKFLOW_STATE_IDLE) {
            controller.command('gcode:start');
            return;
        }

        if (
            workflow.state === WORKFLOW_STATE_PAUSED ||
            activeState === GRBL_ACTIVE_STATE_HOLD
        ) {
            controller.command('gcode:resume');
        }
    };
    const handlePause = (): void => {
        controller.command('gcode:pause');
    };
    const handleStop = (): void => {
        onStop();
        controller.command('gcode:stop', { force: true });
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
                    'grid grid-cols-[1fr_2fr] gap-[1px] items-center h-12 w-24 px-2 text-base rounded border-solid border-gray-600 duration-150 ease-in-out',
                    '[box-shadow:_0.4px_0.4px_2px_2px_var(--tw-shadow-color)] shadow-gray-500',
                    {
                        'bg-gray-300 text-gray-600': disabled,
                        'bg-green-600 text-white': !disabled && type === START,
                        'bg-orange-400 text-white': !disabled && type === PAUSE,
                        'bg-red-500 text-white': !disabled && type === STOP,
                    },
                )}
                title={type}
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
