import jogWheeelLabels from './assets/labels.svg';
import { JogInput } from 'app/features/Jogging/components/JogInput.tsx';
import { JogWheel } from 'app/features/Jogging/components/JogWheel.tsx';
import { useCallback, useEffect, useState } from 'react';
import { SpeedSelector } from 'app/features/Jogging/components/SpeedSelector.tsx';
import { ZJog } from 'app/features/Jogging/components/ZJog.tsx';
import { AJog } from 'app/features/Jogging/components/AJog.tsx';
import store from 'app/store';
import stopSign from './assets/stop.svg';
import { cancelJog } from 'app/features/Jogging/utils/Jogging.ts';
import { FirmwareFlavour } from 'app/features/Connection';
import { useSelector } from 'react-redux';
import { RootState } from 'app/store/redux';
import get from 'lodash/get';
import {
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_JOG,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import includes from 'lodash/includes';

export interface JogValueObject {
    xyStep: number;
    aStep: number;
    zStep: number;
    feedrate: number;
}

export function Jogging() {
    const [isRotaryMode, setIsRotaryMode] = useState(false);

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

    useEffect(() => {
        const mode = store.get('workspace.mode', 'DEFAULT') === 'ROTARY';
        setIsRotaryMode(mode);
        store.on('change', () => {
            const workspaceMode = store.get('workspace.mode', 'DEFAULT');
            setIsRotaryMode(workspaceMode === 'ROTARY');
        });
    }, []);

    function updateJogValues(values: JogValueObject) {
        setJogSpeed(values);
    }

    return (
        <>
            <div className="mt-4 flex flex-row w-full gap-2 justify-around items-center select-none">
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
            <div className="flex flex-row justify-around flex-shrink">
                <div className="grid grid-cols-2 gap-1">
                    <JogInput label="XY" currentValue={jogSpeed.xyStep} />
                    <JogInput label="Z" currentValue={jogSpeed.zStep} />
                    <JogInput label="at" currentValue={jogSpeed.feedrate} />
                    {(firmware === 'grblHAL' || isRotaryMode) && (
                        <JogInput label="A°" currentValue={jogSpeed.aStep} />
                    )}
                </div>
                <SpeedSelector onClick={updateJogValues} />
            </div>
        </>
    );
}
