import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import includes from 'lodash/includes';
import get from 'lodash/get';

import { JogInput } from 'app/features/Jogging/components/JogInput.tsx';
import { JogWheel } from 'app/features/Jogging/components/JogWheel.tsx';
import { SpeedSelector } from 'app/features/Jogging/components/SpeedSelector.tsx';
import { ZJog } from 'app/features/Jogging/components/ZJog.tsx';
import { AJog } from 'app/features/Jogging/components/AJog.tsx';
import store from 'app/store';
import {
    cancelJog,
    jogAxis,
    JoggingSpeedOptions,
} from 'app/features/Jogging/utils/Jogging.ts';
import { FirmwareFlavour } from 'app/features/Connection';
import { RootState } from 'app/store/redux';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    JOGGING_CATEGORY,
    WORKFLOW_STATE_RUNNING,
    WORKSPACE_MODE,
} from 'app/constants';

import stopSign from './assets/stop.svg';
import jogWheeelLabels from './assets/labels.svg';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import debounce from 'lodash/debounce';
import { toast } from 'app/lib/toaster';
import cx from 'classnames';
import controller from 'app/lib/controller';
import useKeybinding from 'app/lib/useKeybinding';
export interface JogValueObject {
    xyStep: number;
    aStep: number;
    zStep: number;
    feedrate: number;
}

const debouncedSaveJogSpeed = debounce(
    (jogSpeed: JogValueObject, selectedSpeed: JoggingSpeedOptions) => {
        const key = selectedSpeed.toLowerCase();
        store.replace(`widgets.axes.jog.${key}`, jogSpeed);
    },
    500,
);

export function Jogging() {
    const { mode } = useWorkspaceState();

    const axes = useSelector((state: RootState) => {
        const controllerState = state.controller.state;
        return get(controllerState, 'axes.axes', ['X', 'Y', 'Z']);
    });

    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );
    const workflowState = useSelector(
        (state: RootState) => state.controller.workflow.state,
    );
    const activeState = useSelector((state: RootState) => {
        return get(state, 'controller.state.status.activeState', 'Idle');
    });

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflowState === WORKFLOW_STATE_RUNNING) return false;

        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG];

        return includes(states, activeState);
    }, [isConnected, workflowState, activeState])();

    const [jogSpeed, setJogSpeed] = useState<JogValueObject>({
        xyStep: 0,
        zStep: 0,
        aStep: 0,
        feedrate: 0,
    });
    const [selectedSpeed, setSelectedSpeed] =
        useState<JoggingSpeedOptions>('Normal');
    const [firmware, setFirmware] = useState<FirmwareFlavour>('Grbl');

    useEffect(() => {
        const jogValues = store.get('widgets.axes.jog.normal', {});
        const firmwareType = store.get(
            'widgets.connection.controller.type',
            'Grbl',
        );
        setFirmware(firmwareType);
        setJogSpeed({
            ...jogValues,
        });
    }, []);

    function updateJogValues(
        values: JogValueObject,
        speed: JoggingSpeedOptions,
    ) {
        setSelectedSpeed(speed);
        setJogSpeed(values);
    }
    function updateXYStep(step: number) {
        const newJogSpeed = {
            xyStep: step,
            zStep: jogSpeed.zStep,
            aStep: jogSpeed.aStep,
            feedrate: jogSpeed.feedrate,
        };
        setJogSpeed(newJogSpeed);
        debouncedSaveJogSpeed(newJogSpeed, selectedSpeed);
    }
    function updateZStep(step: number) {
        const newJogSpeed = {
            xyStep: jogSpeed.xyStep,
            zStep: step,
            aStep: jogSpeed.aStep,
            feedrate: jogSpeed.feedrate,
        };
        setJogSpeed(newJogSpeed);
        debouncedSaveJogSpeed(newJogSpeed, selectedSpeed);
    }
    function updateAStep(step: number) {
        const newJogSpeed = {
            xyStep: jogSpeed.xyStep,
            zStep: jogSpeed.zStep,
            aStep: step,
            feedrate: jogSpeed.feedrate,
        };
        setJogSpeed(newJogSpeed);
        debouncedSaveJogSpeed(newJogSpeed, selectedSpeed);
    }
    function updateFeedrate(frate: number) {
        const newJogSpeed = {
            xyStep: jogSpeed.xyStep,
            zStep: jogSpeed.zStep,
            aStep: jogSpeed.aStep,
            feedrate: frate,
        };
        setJogSpeed(newJogSpeed);
        debouncedSaveJogSpeed(newJogSpeed, selectedSpeed);
    }

    const shuttleControlFunctions = {
        JOG: (
            _: Event,
            { axis = null }: { axis: { [key: string]: number } | null },
        ) => {
            const isInRotaryMode =
                store.get('workspace.mode', '') === WORKSPACE_MODE.ROTARY;

            const controllerIsGrbl = firmware === 'Grbl';

            if (controllerIsGrbl && axis.a && !isInRotaryMode) {
                return;
            }

            const { xyStep, zStep, aStep, feedrate } = jogSpeed;

            const axisList: Record<string, number> = {};

            if (axis.x) {
                axisList.x = xyStep * axis.x;
            }
            if (axis.y) {
                axisList.y = xyStep * axis.y;
            }
            if (axis.z) {
                axisList.z = zStep * axis.z;
            }
            if (axis.a) {
                axisList.a = aStep * axis.a;
            }

            console.log('axisList', axisList);
            console.log('feedrate', feedrate);
            console.log('firmware', jogSpeed);

            // TODO: Add continuous jogging
            jogAxis(axisList, feedrate);
        },
        UPDATE_WORKSPACE_MODE: () => {
            const currentWorkspaceMode = store.get(
                'workspace.mode',
                WORKSPACE_MODE.DEFAULT,
            );
            const workspaceModesList: string[] = Object.values(WORKSPACE_MODE);
            const currentWorkspaceModeIndex = workspaceModesList.findIndex(
                (mode) => mode === currentWorkspaceMode,
            );
            const nextWorkspaceMode =
                workspaceModesList[currentWorkspaceModeIndex + 1] ??
                workspaceModesList[0];
            const rotaryTabEnabled = store.get('widgets.rotary.tab.show');

            if (!rotaryTabEnabled) {
                return;
            }

            store.replace('workspace.mode', nextWorkspaceMode);

            toast.info(
                `Workspace Mode set to ${nextWorkspaceMode.charAt(0).toUpperCase() + nextWorkspaceMode.slice(1).toLowerCase()}`,
            );
        },
    };

    const shuttleControlEvents = {
        JOG_A_PLUS: {
            // Jog A+
            id: 100,
            title: 'Jog: A+',
            keys: ['ctrl', '6'].join('+'),
            cmd: 'JOG_A_PLUS',
            payload: {
                axis: { a: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_A_MINUS: {
            // Jog A-
            id: 101,
            title: 'Jog: A-',
            keys: ['ctrl', '4'].join('+'),
            cmd: 'JOG_A_MINUS',
            payload: {
                axis: { a: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        SWITCH_WORKSPACE_MODE: {
            id: 103,
            title: 'Switch Between Workspace Modes',
            keys: ['ctrl', '5'].join('+'),
            cmd: 'SWITCH_WORKSPACE_MODE',
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.UPDATE_WORKSPACE_MODE,
        },
        JOG_X_P: {
            title: 'Jog: X+',
            keys: 'shift+right',
            gamepadKeys: '15',
            keysName: 'Arrow Right',
            cmd: 'JOG_X_P',
            payload: {
                axis: { x: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_M: {
            title: 'Jog: X-',
            keys: 'shift+left',
            gamepadKeys: '14',
            keysName: 'Arrow Left',
            cmd: 'JOG_X_M',
            payload: {
                axis: { x: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Y_P: {
            title: 'Jog: Y+',
            keys: 'shift+up',
            gamepadKeys: '12',
            keysName: 'Arrow Up',
            cmd: 'JOG_Y_P',
            payload: {
                axis: { y: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Y_M: {
            title: 'Jog: Y-',
            keys: 'shift+down',
            gamepadKeys: '13',
            keysName: 'Arrow Down',
            cmd: 'JOG_Y_M',
            payload: {
                axis: { y: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Z_P: {
            title: 'Jog: Z+',
            keys: 'shift+pageup',
            gamepadKeys: '5',
            keysName: 'Left Button',
            cmd: 'JOG_Z_P',
            payload: {
                axis: { z: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_Z_M: {
            title: 'Jog: Z-',
            keys: 'shift+pagedown',
            gamepadKeys: '4',
            keysName: 'Right Button',
            cmd: 'JOG_Z_M',
            payload: {
                axis: { z: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_P_Y_M: {
            title: 'Jog: X+ Y-',
            keys: '',
            gamepadKeys: '13+15',
            keysName: 'Arrow Right and Arrow Down',
            cmd: 'JOG_X_P_Y_M',
            payload: {
                axis: { x: 1, y: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_M_Y_P: {
            title: 'Jog: X- Y+',
            keys: '',
            gamepadKeys: '13+14',
            keysName: 'Arrow Left and Arrow Down',
            cmd: 'JOG_X_M_Y_P',
            payload: {
                axis: { x: -1, y: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_Y_P: {
            title: 'Jog: X+ Y+',
            keys: '',
            gamepadKeys: '12+15',
            keysName: 'Arrow Right and Arrow Up',
            cmd: 'JOG_X_Y_P',
            payload: {
                axis: { x: 1, y: 1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        JOG_X_Y_M: {
            title: 'Jog: X- Y-',
            keys: '',
            gamepadKeys: '13+14',
            keysName: 'Arrow Left and Arrow Down',
            cmd: 'JOG_X_Y_M',
            payload: {
                axis: { x: -1, y: -1 },
            },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: shuttleControlFunctions.JOG,
        },
        STOP_JOG: {
            // this one is for the shortcut. can be used at any time, even when not continuous jogging.
            title: 'Stop Jog',
            keys: '',
            cmd: 'STOP_JOG',
            payload: { force: true },
            preventDefault: false,
            isActive: true,
            category: JOGGING_CATEGORY,
            callback: () => {
                controller.command('jog:stop');
            },
        },
        // STOP_CONT_JOG: { // this one is for other functions to call when continuous jogging
        //     cmd: 'STOP_CONT_JOG',
        //     payload: { force: true },
        //     preventDefault: false,
        //     callback: (event: Event, payload: any) => {
        //         if (event) {
        //             preventDefault(event);
        //         }

        //         this.handleShortcutStop(payload);
        //     },
        // },
        // SET_R_JOG_PRESET: {
        //     title: 'Select Rapid Jog Preset',
        //     keys: ['shift', 'v'].join('+'),
        //     cmd: 'SET_R_JOG_PRESET',
        //     payload: {
        //         key: SPEED_RAPID
        //     },
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: this.shuttleControlFunctions.SET_JOG_PRESET,
        // },
        // SET_N_JOG_PRESET: {
        //     title: 'Select Normal Jog Preset',
        //     keys: ['shift', 'c'].join('+'),
        //     cmd: 'SET_N_JOG_PRESET',
        //     payload: {
        //         key: SPEED_NORMAL
        //     },
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: this.shuttleControlFunctions.SET_JOG_PRESET,
        // },
        // SET_P_JOG_PRESET: {
        //     title: 'Select Precise Jog Preset',
        //     keys: ['shift', 'x'].join('+'),
        //     cmd: 'SET_P_JOG_PRESET',
        //     payload: {
        //         key: SPEED_PRECISE
        //     },
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: this.shuttleControlFunctions.SET_JOG_PRESET,
        // },
        // CYCLE_JOG_PRESETS: {
        //     title: 'Cycle Through Jog Presets',
        //     keys: ['shift', 'z'].join('+'),
        //     cmd: 'CYCLE_JOG_PRESETS',
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: () => {
        //         const { selectedSpeed } = this.state;

        //         const presets = [SPEED_RAPID, SPEED_NORMAL, SPEED_PRECISE];
        //         const nextIndex = presets.findIndex(preset => preset === selectedSpeed) + 1;
        //         const key = presets[nextIndex] ? presets[nextIndex] : presets[0];

        //         this.actions.setSelectedSpeed(key);
        //         this.actions.setJogFromPreset(key);
        //     },
        // },
        // JOG_SPEED_I: {
        //     title: 'Increase Jog Speed',
        //     keys: '=',
        //     gamepadKeys: '7',
        //     keysName: 'Right Trigger',
        //     cmd: 'JOG_SPEED_I',
        //     payload: {
        //         speed: 'increase'
        //     },
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: this.shuttleControlFunctions.JOG_SPEED
        // },
        // JOG_SPEED_D: {
        //     title: 'Decrease Jog Speed',
        //     keys: '-',
        //     gamepadKeys: '6',
        //     keysName: 'Left Trigger',
        //     cmd: 'JOG_SPEED_D',
        //     payload: {
        //         speed: 'decrease'
        //     },
        //     preventDefault: false,
        //     isActive: true,
        //     category: JOGGING_CATEGORY,
        //     callback: this.shuttleControlFunctions.JOG_SPEED
        // }
    };

    useKeybinding(shuttleControlEvents);

    const isRotaryMode = mode === 'ROTARY';

    return (
        <>
            <div className="flex flex-row w-full gap-2 justify-around items-center select-none xl:mt-4">
                <div className="min-w-[180px] relative">
                    <JogWheel
                        distance={jogSpeed.xyStep}
                        feedrate={jogSpeed.feedrate}
                        canClick={canClick}
                    />
                    <img
                        className="absolute top-0 left-0 pointer-events-none"
                        src={jogWheeelLabels}
                        alt="Jog wheel arrows"
                    />
                    <img
                        src={stopSign}
                        className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2"
                        alt="E-Stop button"
                        onClick={cancelJog}
                    />
                </div>
                <div className="flex justify-center gap-4">
                    <ZJog
                        distance={jogSpeed.zStep}
                        feedrate={jogSpeed.feedrate}
                        canClick={canClick}
                    />
                    {axes && (isRotaryMode || axes.includes('A')) && (
                        <AJog
                            distance={jogSpeed.aStep}
                            feedrate={jogSpeed.feedrate}
                            canClick={canClick}
                        />
                    )}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="flex w-full items-center justify-center">
                    <div
                        className={cx('grid gap-x-1 items-center', {
                            'grid-cols-2 gap-y-3':
                                firmware === 'grblHAL' || isRotaryMode,
                            'grid-cols-1 gap-y-1':
                                firmware !== 'grblHAL' && !isRotaryMode,
                        })}
                    >
                        <JogInput
                            label="XY"
                            currentValue={jogSpeed.xyStep}
                            onChange={updateXYStep}
                        />
                        <JogInput
                            label="Z"
                            currentValue={jogSpeed.zStep}
                            onChange={updateZStep}
                        />
                        {(firmware === 'grblHAL' || isRotaryMode) && (
                            <JogInput
                                label="A°"
                                currentValue={jogSpeed.aStep}
                                onChange={updateAStep}
                            />
                        )}
                        <JogInput
                            label="at"
                            currentValue={jogSpeed.feedrate}
                            onChange={updateFeedrate}
                        />
                    </div>
                </div>
                <div className="flex float-right">
                    <SpeedSelector handleClick={updateJogValues} />
                </div>
            </div>
        </>
    );
}
