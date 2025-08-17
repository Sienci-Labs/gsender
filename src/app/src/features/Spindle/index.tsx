import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import debounce from 'lodash/debounce';
import pubsub from 'pubsub-js';

import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { updatePartialControllerSettings } from 'app/store/redux/slices/controller.slice';
import store from 'app/store';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import { convertToImperial } from 'app/lib/units';
import { UNITS_EN, UNITS_GCODE } from 'app/definitions/general';
import WidgetConfig from '../WidgetConfig/WidgetConfig';
import {
    GRBL,
    GRBLHAL,
    GRBL_ACTIVE_STATE_IDLE,
    IMPERIAL_UNITS,
    LASER_MODE,
    SPINDLE_LASER_CATEGORY,
    SPINDLE_MODE,
    WORKFLOW_STATE_RUNNING,
} from '../../constants';
import SpindleControls from './components/SpindleControls';
import LaserControls from './components/LaserControls';
import ModalToggle from './components/ModalToggle';
// import ActiveIndicator from './components/ActiveIndicator';
import SpindleSelector from './components/SpindleSelector';
import { roundMetric, round } from '../../lib/rounding';
import useKeybinding from 'app/lib/useKeybinding';
import useShuttleEvents from 'app/hooks/useShuttleEvents';
import { findIndex, get } from 'lodash';
import reduxStore from 'app/store/redux';

interface SpindleState {
    minimized: boolean;
    isFullscreen: boolean;
    canClick: boolean;
    mode: string;
    spindleSpeed: number;
    laser: {
        duration: number;
        power: number;
        maxPower: number;
    };
    spindleMax: number;
    spindleMin: number;
}

const SpindleWidget = () => {
    const dispatch = useDispatch();
    const config = new WidgetConfig('spindle');

    const [state, setState] = useState<SpindleState>(() => ({
        minimized: config.get('minimized', false),
        isFullscreen: false,
        canClick: true,
        mode: config.get('mode', ''),
        spindleSpeed: config.get('speed', 1000),
        laser: config.get('laser', { duration: 0, power: 0, maxPower: 0 }),
        spindleMax: config.get('spindleMax', 0),
        spindleMin: config.get('spindleMin', 0),
    }));

    const stateRef = useRef<SpindleState>(state);

    const {
        workflow,
        isConnected,
        controllerState,
        controllerType,
        spindleModal,
        spindleMin,
        spindleMax,
        laserAsSpindle,
        wcs,
        wpos,
        units,
        availableSpindles,
        $13,
        spindle,
        laserMax,
        laserMin,
        laserXOffset,
        laserYOffset,
    } = useTypedSelector((state) => ({
        workflow: state.controller.workflow,
        isConnected: state.connection.isConnected ?? false,
        controllerState: state.controller.state ?? {},
        controllerType: state.controller.type ?? 'grbl',
        spindleModal: state.controller.modal.spindle ?? 'M5',
        spindleMin: Number(state.controller.settings.settings.$31 ?? 1000),
        spindleMax: Number(state.controller.settings.settings.$30 ?? 30000),
        laserAsSpindle: Number(state.controller.settings.settings.$32 ?? 0),
        wcs: state.controller.modal.wcs ?? '',
        wpos: state.controller.wpos ?? { x: 0, y: 0 },
        units: state.controller.modal.units ?? {},
        availableSpindles: state.controller.spindles ?? [],
        $13: state.controller.settings.settings.$13 ?? '0',
        spindle: state.controller.spindles.find((s) => s.enabled) ?? {
            label: 'Default Spindle',
            id: '0',
            enabled: true,
            capabilities: '',
            laser: false,
            raw: '',
            order: 0,
        },
        laserMax: Number(state.controller.settings.settings.$730 ?? 255),
        laserMin: Number(state.controller.settings.settings.$731 ?? 0),
        laserXOffset: Number(state.controller.settings.settings.$741 ?? 0),
        laserYOffset: Number(state.controller.settings.settings.$742 ?? 0),
    }));

    const [isLaserOn, setIsLaserOn] = useState<boolean>(false);
    const [isSpindleOn, setIsSpindleOn] = useState<boolean>(false);

    useEffect(() => {
        const tokens = [
            pubsub.subscribe(
                'laser:updated',
                (_: string, data: Partial<SpindleState['laser']>) => {
                    setState((prevState) => ({
                        ...prevState,
                        laser: { ...prevState.laser, ...data },
                    }));
                },
            ),
            pubsub.subscribe(
                'spindle:updated',
                (
                    _: string,
                    data: { spindleMax: number; spindleMin: number },
                ) => {
                    setState((prevState) => ({
                        ...prevState,
                        spindleMax: data.spindleMax,
                        spindleMin: data.spindleMin,
                    }));
                },
            ),
        ];

        return () => {
            tokens.forEach((token) => pubsub.unsubscribe(token));
        };
    }, []);

    useEffect(() => {
        config.set('laser.duration', state.laser.duration);
        config.set('laser.power', state.laser.power);
        config.set('mode', state.mode);
        config.set('minimized', state.minimized);

        if (state.mode === SPINDLE_MODE && !laserAsSpindle) {
            let newSpindleSpeed = state.spindleSpeed;
            if (state.spindleSpeed > spindleMax) {
                newSpindleSpeed = spindleMax;
            } else if (state.spindleSpeed < spindleMin) {
                newSpindleSpeed = spindleMin;
            }
            config.set('speed', newSpindleSpeed);
            updateSpindleSpeed(newSpindleSpeed);
        }
    }, [state, laserAsSpindle, spindleMax, spindleMin]);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const updateSpindleSpeed = useCallback(
        (speed: number) => {
            if (state.spindleSpeed !== speed) {
                setState((prevState) => ({
                    ...prevState,
                    spindleSpeed: speed,
                }));
                if (isSpindleOn) {
                    debounceSpindleSpeed(speed);
                }
            }
        },
        [state.spindleSpeed, isSpindleOn],
    );

    const debounceSpindleSpeed = useCallback(
        debounce((speed: number) => {
            controller.command('spindlespeed:change', speed);
        }, 300),
        [],
    );

    const debounceLaserPower = useCallback(
        debounce((power: number, maxPower: number) => {
            controller.command('laserpower:change', power, maxPower);
        }, 300),
        [],
    );

    const updateControllerSettings = useCallback(
        (max: number, min: number, mode: string) => {
            dispatch(
                updatePartialControllerSettings({
                    $30: max.toString(),
                    $31: min.toString(),
                    $32: `${mode}`,
                }),
            );
        },
        [dispatch],
    );

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (![GRBL, GRBLHAL].includes(controllerType)) return false;

        const activeState = controllerState?.status?.activeState;
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    }, [
        isConnected,
        workflow.state,
        controllerType,
        controllerState?.status?.activeState,
    ]);

    const canClickShortcut = (): boolean => {
        const isConnected = get(
            reduxStore.getState(),
            'connection.isConnected',
        );
        const workflow = get(reduxStore.getState(), 'controller.workflow');
        const controllerType = get(reduxStore.getState(), 'controller.type');
        const controllerState = get(reduxStore.getState(), 'controller.state');

        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (![GRBL, GRBLHAL].includes(controllerType)) return false;

        const activeState = controllerState?.status?.activeState;
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    };

    const getSpindleActiveState = useCallback((): boolean => {
        return spindleModal !== 'M5';
    }, [spindleModal]);

    const getLaserOffsetCode = (preferredUnits: UNITS_GCODE | UNITS_EN) => {
        const laser = config.get('laser', {
            minPower: 0,
            maxPower: 0,
        });

        setState((prevState) => ({
            ...prevState,
            laser,
        }));
        let { xOffset, yOffset } = laser;

        // If using grblHAL AND SLB_LASER, use the eeprom laser offset values
        if (controllerType === GRBLHAL) {
            xOffset = laserXOffset;
            yOffset = laserYOffset;
        }

        if (preferredUnits === 'G20') {
            xOffset = convertToImperial(xOffset);
            yOffset = convertToImperial(yOffset);
        } else {
            xOffset = roundMetric(xOffset);
            yOffset = roundMetric(yOffset);
        }
        const [xoffsetAdjusted, yOffsetAdjusted] =
            actions.calculateAdjustedOffsets(xOffset, yOffset, preferredUnits);

        const currentWCS = actions.getWCS();

        let offsetQuery = [];
        if (xOffset === 0 && yOffset !== 0) {
            offsetQuery = [`G10 L20 P${currentWCS} Y${yOffsetAdjusted}`];
        } else if (xOffset !== 0 && yOffset === 0) {
            offsetQuery = [`G10 L20 P${currentWCS} X${xoffsetAdjusted}`];
        } else if (xOffset !== 0 && yOffset !== 0) {
            offsetQuery = [
                `G10 L20 P${currentWCS} X${xoffsetAdjusted} Y${yOffsetAdjusted}`,
            ];
        } else {
            offsetQuery = [''];
        }
        return offsetQuery;
    };

    const enableSpindleMode = () => {
        const preferredUnits =
            store.get('workspace.units') === IMPERIAL_UNITS ? 'G20' : 'G21';
        const active = getSpindleActiveState();

        // get previously saved spindle values
        const prevSpindleMin = config.get('spindleMin', 0);
        const prevSpindleMax = config.get('spindleMax', 0);

        const SLBLaserExists =
            controllerType === GRBLHAL &&
            findIndex(availableSpindles, (o) => o.label === 'SLB_LASER') !== -1;

        // save current laser values if laser spindle doesnt exist
        if (!SLBLaserExists) {
            let laser = config.get('laser', {
                maxPower: 0,
                minPower: 0,
            });
            laser.maxPower = spindleMax;
            laser.minPower = spindleMin;
            config.set('laser', laser);
        }

        const powerCommands = SLBLaserExists
            ? []
            : [`$30=${prevSpindleMax}`, `$31=${prevSpindleMin}`];

        if (active) {
            setIsSpindleOn(false);
            controller.command('gcode', 'M5');
            //this.setInactive();
        }
        const commands = [
            preferredUnits,
            ...actions.getSpindleOffsetCode(preferredUnits),
            ...powerCommands,
            '$32=0',
            units,
        ];

        // only update max/min if slb laser doesnt exist
        if (!SLBLaserExists) {
            updateControllerSettings(prevSpindleMax, prevSpindleMin, '0');
        } else {
            // update only laser/spindle mode eeprom if slb laser exists
            dispatch(
                updatePartialControllerSettings({
                    $32: '0',
                }),
            );
        }

        controller.command('gcode', commands);
    };

    const enableLaserMode = () => {
        const preferredUnits =
            store.get('workspace.units') === IMPERIAL_UNITS ? 'G20' : 'G21';
        const active = getSpindleActiveState();

        // get previously saved laser values
        const laser = config.get('laser', {
            minPower: 0,
            maxPower: 0,
        });
        const { minPower, maxPower } = laser;

        const SLBLaserExists =
            controllerType === GRBLHAL &&
            findIndex(availableSpindles, (o) => o.label === 'SLB_LASER') !== -1;

        // save current spindle values if laser spindle doesnt exist
        if (!SLBLaserExists) {
            config.set('spindleMin', spindleMin);
            config.set('spindleMax', spindleMax);
        }

        const powerCommands = SLBLaserExists
            ? []
            : [`$30=${maxPower}`, `$31=${minPower}`];

        if (active) {
            setIsLaserOn(false);
            controller.command('gcode', 'M5');
        }
        const commands = [
            preferredUnits,
            ...getLaserOffsetCode(preferredUnits),
            ...powerCommands,
            '$32=1',
            units,
        ];

        // only update max/min if slb laser doesnt exist
        if (!SLBLaserExists) {
            updateControllerSettings(maxPower, minPower, '1');
        } else {
            // update only laser/spindle mode eeprom if slb laser exists
            dispatch(
                updatePartialControllerSettings({
                    $32: '1',
                }),
            );
        }
        controller.command('gcode', commands);
    };

    const actions = {
        handleModeToggle: () => {
            const newMode =
                stateRef.current.mode === LASER_MODE
                    ? SPINDLE_MODE
                    : LASER_MODE;
            setState((prevState) => ({ ...prevState, mode: newMode }));
            if (newMode === SPINDLE_MODE) {
                enableSpindleMode();
            } else {
                enableLaserMode();
            }
            pubsub.publish('spindle:mode', newMode);
        },
        sendM3: () => {
            setIsSpindleOn(true);
            controller.command('gcode', `M3 S${stateRef.current.spindleSpeed}`);
        },
        sendM4: () => {
            setIsSpindleOn(true);
            controller.command('gcode', `M4 S${stateRef.current.spindleSpeed}`);
        },
        sendM5: () => {
            setIsLaserOn(false);
            setIsSpindleOn(false);
            controller.command('gcode', 'M5 S0');
        },
        sendLaserM3: () => {
            const laserPower =
                stateRef.current.laser.maxPower *
                (stateRef.current.laser.power / 100);

            setIsLaserOn(true);
            controller.command('gcode', `G1F1 M3 S${laserPower}`);
        },
        handleSpindleSpeedChange: (value: number) => {
            if (isSpindleOn) {
                debounceSpindleSpeed(value);
            }
            setState((prevState) => ({ ...prevState, spindleSpeed: value }));
        },
        handleLaserPowerChange: (value: number) => {
            if (isLaserOn) {
                debounceLaserPower(
                    value,
                    spindle.label === 'SLB_LASER'
                        ? laserMax
                        : state.laser.maxPower,
                );
            }
            setState((prevState) => ({
                ...prevState,
                laser: { ...prevState.laser, power: value },
            }));
        },
        handleLaserDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = Math.abs(Number(e.target.value) || 0);
            setState((prevState) => ({
                ...prevState,
                laser: { ...prevState.laser, duration: value },
            }));
        },
        runLaserTest: () => {
            const { power, duration } = state.laser;
            const maxPower =
                spindle.label === 'SLB_LASER' ? laserMax : state.laser.maxPower;
            controller.command('lasertest:on', power, duration, maxPower);
            setTimeout(() => {
                actions.sendM5();
            }, duration * 1000);
        },
        runShortcutLaserTest: () => {
            const spindle = get(
                reduxStore.getState(),
                'controller.spindles',
            ).find((s) => s.enabled) ?? {
                label: 'Default Spindle',
                id: '0',
                enabled: true,
                capabilities: '',
                laser: false,
                raw: '',
                order: 0,
            };
            const laserMax = Number(
                get(
                    reduxStore.getState(),
                    'controller.settings.settings.$730',
                ) ?? 255,
            );
            const { power, duration } = stateRef.current.laser;
            const maxPower =
                spindle.label === 'SLB_LASER'
                    ? laserMax
                    : stateRef.current.laser.maxPower;

            controller.command('lasertest:on', power, duration, maxPower);
            setTimeout(() => {
                actions.sendM5();
            }, duration * 1000);
        },
        handleHALSpindleSelect: (selectedSpindle: {
            label: string;
            value: string | number;
        }) => {
            controller.command('gcode', [
                `M104 Q${selectedSpindle.value}`,
                '$spindles',
            ]);
        },
        enableSpindleMode() {
            const preferredUnits =
                store.get('workspace.units') === IMPERIAL_UNITS ? 'G20' : 'G21';
            const active = getSpindleActiveState();

            // get previously saved spindle values
            const spindleMin = config.get('spindleMin', 0);
            const spindleMax = config.get('spindleMax', 0);

            // save current laser values
            let laser = config.get('laser', {
                maxPower: 0,
                minPower: 0,
            });
            laser.maxPower = laserMax;
            laser.minPower = laserMin;

            config.set('laser', laser);

            const powerCommands =
                spindle.label === 'SLB_LASER'
                    ? []
                    : [`$30=${spindleMax}`, `$31=${spindleMin}`];

            if (active) {
                setIsSpindleOn(false);
                controller.command('gcode', 'M5');
                //this.setInactive();
            }
            const commands = [
                preferredUnits,
                ...actions.getSpindleOffsetCode(preferredUnits),
                ...powerCommands,
                '$32=0',
                units,
            ];
            updateControllerSettings(spindleMax, spindleMin, '0');
            controller.command('gcode', commands);
        },
        getSpindleOffsetCode(preferredUnits: UNITS_GCODE | UNITS_EN): string[] {
            const laser = config.get('laser', {
                maxPower: 0,
                minPower: 0,
            });

            setState((prevState) => ({
                ...prevState,
                laser,
            }));

            let offsetQuery = [];

            let { xOffset, yOffset } = laser;

            // If using grblHAL AND SLB_LASER, use the eeprom laser offset values
            if (controllerType === GRBLHAL) {
                xOffset = laserXOffset;
                yOffset = laserYOffset;
            }

            xOffset = Number(xOffset) * -1;
            yOffset = Number(yOffset) * -1;
            if (preferredUnits === 'G20') {
                xOffset = convertToImperial(xOffset);
                yOffset = convertToImperial(yOffset);
            } else {
                xOffset = roundMetric(xOffset);
                yOffset = roundMetric(yOffset);
            }

            const currentWCS = actions.getWCS();

            const [xoffsetAdjusted, yOffsetAdjusted] =
                actions.calculateAdjustedOffsets(
                    xOffset,
                    yOffset,
                    preferredUnits,
                );
            if (xOffset === 0 && yOffset !== 0) {
                offsetQuery = [`G10 L20 P${currentWCS} Y${yOffsetAdjusted}`];
            } else if (xOffset !== 0 && yOffset === 0) {
                offsetQuery = [`G10 L20 P${currentWCS} X${xoffsetAdjusted}`];
            } else if (xOffset !== 0 && yOffset !== 0) {
                offsetQuery = [
                    `G10 L20 P${currentWCS} X${xoffsetAdjusted} Y${yOffsetAdjusted}`,
                ];
            } else {
                offsetQuery = [''];
            }

            return offsetQuery;
        },
        // Take into account the current wpos when setting offsets
        calculateAdjustedOffsets(
            xOffset: number,
            yOffset: number,
            units: UNITS_GCODE | UNITS_EN,
        ): [number, number] {
            let { x, y } = wpos;

            if ($13 === '1' || units === 'G20') {
                units = 'G20';
                x /= 25.4;
                y /= 25.4;
            }
            return [
                round(Number(x) + Number(xOffset), units),
                round(Number(y) + Number(yOffset), units),
            ];
        },
        getWCS(): number {
            const p: number =
                {
                    G54: 1,
                    G55: 2,
                    G56: 3,
                    G57: 4,
                    G58: 5,
                    G59: 6,
                }[wcs] || 0;

            return p;
        },
    };

    const shuttleControlEvents = {
        TOGGLE_SPINDLE_LASER_MODE: {
            title: 'Toggle Between Spindle and Laser Mode',
            keys: '',
            cmd: 'TOGGLE_SPINDLE_LASER_MODE',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                if (!canClickShortcut()) {
                    return;
                }
                actions.handleModeToggle();
            },
        },
        CW_LASER_ON: {
            title: 'CW / Laser On',
            keys: '',
            cmd: 'CW_LASER_ON',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                if (!canClickShortcut()) {
                    return;
                }
                stateRef.current.mode === LASER_MODE
                    ? actions.sendLaserM3()
                    : actions.sendM3();
            },
        },
        CCW_LASER_TEST: {
            title: 'CCW / Laser Test',
            keys: '',
            cmd: 'CCW_LASER_TEST',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                if (!canClickShortcut()) {
                    return;
                }
                stateRef.current.mode === LASER_MODE
                    ? actions.runShortcutLaserTest()
                    : actions.sendM4();
            },
        },
        STOP_LASER_OFF: {
            title: 'Stop / Laser Off',
            keys: '',
            cmd: 'STOP_LASER_OFF',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                if (!canClickShortcut()) {
                    return;
                }
                actions.sendM5();
            },
        },
    };

    useKeybinding(shuttleControlEvents);
    useShuttleEvents(shuttleControlEvents);

    // const active = getSpindleActiveState();

    const givenMode = laserAsSpindle ? LASER_MODE : SPINDLE_MODE;

    return (
        <Widget>
            <div>
                <div className="flex gap-2 justify-center">
                    <ModalToggle
                        mode={givenMode}
                        onChange={actions.handleModeToggle}
                        disabled={!canClick()}
                    />
                    {controllerType === GRBLHAL && (
                        <SpindleSelector
                            spindles={availableSpindles}
                            onChange={actions.handleHALSpindleSelect}
                            spindle={spindle}
                            disabled={!canClick()}
                        />
                    )}
                </div>
            </div>
            <div>
                {!laserAsSpindle ? (
                    <SpindleControls
                        state={state}
                        actions={actions}
                        canClick={canClick()}
                    />
                ) : (
                    <LaserControls
                        state={state}
                        actions={actions}
                        canClick={canClick()}
                    />
                )}
            </div>
        </Widget>
    );
};

export default SpindleWidget;
