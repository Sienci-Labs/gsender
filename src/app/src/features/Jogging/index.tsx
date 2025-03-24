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
    JoggingSpeedOptions,
} from 'app/features/Jogging/utils/Jogging.ts';
import { FirmwareFlavour } from 'app/features/Connection';
import { RootState } from 'app/store/redux';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';

import stopSign from './assets/stop.svg';
import jogWheeelLabels from './assets/labels.svg';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';
import debounce from 'lodash/debounce';
import cx from 'classnames';
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
