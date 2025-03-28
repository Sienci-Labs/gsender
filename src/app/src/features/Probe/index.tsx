/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */
import get from 'lodash/get';
import includes from 'lodash/includes';
import { useEffect, useState } from 'react';
// import Space from 'app/components/Space';
import controller from 'app/lib/controller';
import {
    TOUCHPLATE_TYPE_AUTOZERO,
    PROBE_TYPE_AUTO,
    TOUCHPLATE_TYPE_ZERO,
    PROBE_TYPE_DIAMETER,
} from 'app/lib/constants';
import store from 'app/store';
import { convertToImperial } from 'app/lib/units';
import Probe from './Probe';
import RunProbe from './RunProbe';
import {
    // Units
    METRIC_UNITS,
    // Grbl
    GRBL,
    GRBLHAL,
    GRBL_ACTIVE_STATE_IDLE,
    WORKFLOW_STATE_RUNNING,
} from '../../constants';
import { getProbeCode } from 'app/lib/Probing';
import { getWidgetConfigContext } from '../WidgetConfig/WidgetContextProvider';
import {
    Actions,
    AvailableTool,
    PROBE_TYPES_T,
    ProbeCommand,
    ProbeProfile,
    State,
    TOUCHPLATE_TYPES_T,
} from './definitions';
import { BasicObject, UNITS_EN } from 'app/definitions/general';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import { WidgetConfigProvider } from '../WidgetConfig/WidgetContextProvider';

const ProbeWidget = () => {
    const {
        probePinStatus,
        distance,
        type,
        workflow,
        isConnected,
        $13,
        activeState,
    } = useTypedSelector((state) => ({
        distance: state.controller.state.parserstate?.modal.distance,
        probePinStatus: state.controller.state.status?.pinState.P ?? false,
        type: state.controller.type,
        workflow: state.controller.workflow,
        isConnected: state.connection.isConnected,
        $13: state.controller.settings.settings.$13 ?? '0',
        activeState: state.controller.state.status?.activeState,
    }));

    const { actions: config } = getWidgetConfigContext();

    const calcToolDiamater = (): number => {
        const defaultToolDiameter = units === METRIC_UNITS ? 6.35 : 0.25;
        let toolDiameter: number;
        if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
            toolDiameter = null;
        } else {
            toolDiameter =
                availableTools.length === 0
                    ? defaultToolDiameter
                    : availableTools[0][
                          units === METRIC_UNITS
                              ? 'metricDiameter'
                              : 'imperialDiameter'
                      ];
        }
        return toolDiameter;
    };

    const calcProbeType = (): PROBE_TYPES_T => {
        let probeType: PROBE_TYPES_T;
        if (touchplateType === TOUCHPLATE_TYPE_AUTOZERO) {
            probeType = PROBE_TYPE_AUTO;
        } else {
            probeType = PROBE_TYPE_DIAMETER;
        }
        return probeType;
    };

    const [testInterval, setTestInterval] = useState<NodeJS.Timeout>(null);
    const [units, setUnits] = useState<UNITS_EN>(store.get('workspace.units'));
    const [availableTools, setAvailableTools] = useState<AvailableTool[]>(
        store.get('workspace.tools', []),
    );
    const [touchplateType, setTouchplateType] = useState<TOUCHPLATE_TYPES_T>(
        store.get('workspace.probeProfile.touchplateType'),
    );
    // const [toolChangeActive, setToolChangeActive] = useState<boolean>(false);
    // const [port, setPort] = useState<string>(controller.port);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    // const [probeAxis, setProbeAxis] = useState<AXES_T>(config.get('probeAxis', 'Z'));
    const [probeCommand, setProbeCommand] = useState<string>(
        config.get('probeCommand', 'G38.2'),
    );
    const [useTLO, setUseTLO] = useState<boolean>(config.get('useTLO'));
    const [probeDepth, setProbeDepth] = useState<number>(
        config.get('probeDepth') || {},
    );
    const [probeFeedrate, setProbeFeedrate] = useState<number>(
        config.get('probeFeedrate') || {},
    );
    const [probeFastFeedrate, setProbeFastFeedrate] = useState<number>(
        config.get('probeFastFeedrate') || {},
    );
    const [touchPlateHeight, setTouchPlateHeight] = useState<number>(
        config.get('touchPlateHeight') || {},
    );
    const [retractionDistance, setRetractionDistance] = useState<number>(
        config.get('retractionDistance') || {},
    );
    const [zProbeDistance, setZProbeDistance] = useState<number>(
        config.get('zProbeDistance') || {},
    );
    const [touchplate, setTouchplate] = useState<ProbeProfile>(
        store.get('workspace.probeProfile', {}),
    );
    const [toolDiameter, setToolDiameter] =
        useState<number>(calcToolDiamater());
    const [useSafeProbeOption, setUseSafeProbeOption] =
        useState<boolean>(false);
    const [selectedProbeCommand, setSelectedProbeCommand] = useState<number>(0);
    const [connectivityTest, setConnectivityTest] = useState<boolean>(
        config.get('connectivityTest'),
    );
    const [probeType, setProbeType] = useState<PROBE_TYPES_T>(calcProbeType());
    const [connectionMade, setConnectionMade] = useState<boolean>(false);
    const [direction, setDirection] = useState<number>(
        config.get('direction', 0),
    );

    // const DWELL_TIME = 0.3;
    const PROBE_DISTANCE_METRIC = {
        x: 50,
        y: 50,
        z: zProbeDistance ? zProbeDistance : 30,
    };
    const PROBE_DISTANCE_IMPERIAL = {
        x: 2,
        y: 2,
        z: zProbeDistance ? convertToImperial(zProbeDistance) : 1.2,
    };

    const actions: Actions = {
        startConnectivityTest: (): void => {
            const { returnProbeConnectivity } = actions;

            if (testInterval) {
                clearInterval(testInterval);
                setTestInterval(null);
            }
            if (!connectivityTest) {
                setConnectionMade(true);
                return;
            }
            setTestInterval(
                setInterval(() => {
                    if (returnProbeConnectivity()) {
                        setConnectionMade(true);
                        clearInterval(testInterval);
                        setTestInterval(null);
                    }
                }, 250),
            );
        },
        setProbeConnectivity: (connectionMade: boolean): void => {
            setConnectionMade(connectionMade);
        },
        onOpenChange: (isOpen: boolean): void => {
            if (isOpen) {
                actions.startConnectivityTest();
            } else {
                if (testInterval) {
                    clearInterval(testInterval);
                }
                setTestInterval(null);
                setConnectionMade(false);
            }
            setModalIsOpen(isOpen);
        },
        changeProbeCommand: (value: string): void => {
            setProbeCommand(value);
        },
        toggleUseTLO: (): void => {
            setUseTLO(!useTLO);
        },
        handleProbeDepthChange: (event: Event): void => {
            const value = (event.target as HTMLTextAreaElement).value;
            setProbeDepth(Number(value));
        },
        handleProbeFeedrateChange: (event: Event): void => {
            const value = (event.target as HTMLTextAreaElement).value;
            setProbeFeedrate(Number(value));
        },
        handleRetractionDistanceChange: (event: Event): void => {
            const value = (event.target as HTMLTextAreaElement).value;
            setRetractionDistance(Number(value));
        },
        handleProbeCommandChange: (index: number): void => {
            setUseSafeProbeOption(false);
            setSelectedProbeCommand(index);
        },
        handleSafeProbeToggle: (): void => {
            setUseSafeProbeOption(!useSafeProbeOption);
        },
        generatePossibleProbeCommands: (): ProbeCommand[] => {
            const commands = [];
            let command;
            const selectedProfile = touchplate;
            const functions = {
                z: false,
                y: false,
                x: false,
            };

            if (selectedProfile.touchplateType === TOUCHPLATE_TYPE_ZERO) {
                functions.z = true;
            } else {
                functions.z = true;
                functions.y = true;
                functions.x = true;
            }

            //Z
            if (functions.z) {
                command = {
                    id: 'Z Touch',
                    safe: false,
                    tool: false,
                    axes: {
                        x: false,
                        y: false,
                        z: true,
                    },
                };
                commands.push(command);
            }

            if (functions.x && functions.y) {
                if (functions.z) {
                    command = {
                        id: 'XYZ Touch',
                        safe: true,
                        tool: true,
                        axes: {
                            x: true,
                            y: true,
                            z: true,
                        },
                    };
                    commands.push(command);
                }

                command = {
                    id: 'XY Touch',
                    safe: true,
                    tool: true,
                    axes: {
                        x: true,
                        y: true,
                        z: false,
                    },
                };
                commands.push(command);

                command = {
                    id: 'X Touch',
                    safe: true,
                    tool: true,
                    axes: {
                        x: true,
                        y: false,
                        z: false,
                    },
                };
                commands.push(command);

                command = {
                    id: 'Y Touch',
                    safe: true,
                    tool: true,
                    axes: {
                        x: false,
                        y: true,
                        z: false,
                    },
                };
                commands.push(command);
            }
            return commands;
        },
        generateProbeCommands: (): string[] => {
            return generateProbeCommands();
        },
        runProbeCommands: (commands: string[]): void => {
            controller.command('gcode:safe', commands, 'G21');
        },
        returnProbeConnectivity: (): boolean => {
            return probePinStatus;
        },
        _setToolDiameter: (selection: { value: number }): void => {
            let diameter: number;
            let value: number = 0.0;
            if (selection) {
                value = selection.value;
            }
            diameter = Number(value) || 0.0;
            setToolDiameter(diameter);
        },
        _setProbeType: (value: PROBE_TYPES_T): void => {
            setProbeType(value);
        },
        nextProbeDirection: (): void => {
            if (direction === 3) {
                setDirection(0);
            } else {
                setDirection(direction + 1);
            }
        },
    };

    const availableProbeCommands = actions.generatePossibleProbeCommands();

    useEffect(() => {
        store.on('change', onStoreChange);
        actions.generatePossibleProbeCommands();

        return () => {
            store.removeListener('change', onStoreChange);
        };
    }, []);

    useEffect(() => {
        config.set('probeCommand', probeCommand);
        config.set('useTLO', useTLO);
        config.set('probeDepth', probeDepth);
        config.set('touchPlateHeight', touchPlateHeight);
    });

    const determineProbeOptions = (probeCommand: ProbeCommand) => {
        const { axes, tool } = probeCommand;
        return {
            axes: axes,
            calcToolDiameter: !tool,
        };
    };

    const generateProbeCommands = (): string[] => {
        const { axes } = determineProbeOptions(
            availableProbeCommands[selectedProbeCommand],
        );
        let probeDistances =
            units === METRIC_UNITS
                ? PROBE_DISTANCE_METRIC
                : PROBE_DISTANCE_IMPERIAL;
        // Grab units for correct modal
        let zThickness, xyThickness, feedrate, fastFeedrate, retractDistance;
        const modal = units === METRIC_UNITS ? '21' : '20';
        if (units === METRIC_UNITS) {
            zThickness = touchplate.zThickness;
            xyThickness = touchplate.xyThickness;
            feedrate = probeFeedrate;
            fastFeedrate = probeFastFeedrate;
            retractDistance = retractionDistance;
        } else {
            zThickness = convertToImperial(touchplate.zThickness);
            xyThickness = convertToImperial(touchplate.xyThickness);
            feedrate = convertToImperial(probeFeedrate);
            fastFeedrate = convertToImperial(probeFastFeedrate);
            retractDistance = convertToImperial(retractionDistance);
        }

        const options = {
            axes,
            modal,
            probeFast: fastFeedrate,
            probeSlow: feedrate,
            units,
            retract: retractDistance,
            toolDiameter,
            zThickness,
            xyThickness,
            plateType: touchplate.touchplateType,
            $13,
            probeDistances,
            probeType,
        };

        const code = getProbeCode(options, direction);
        code.push(distance + '\n');

        return code;
    };

    const canClick = (): boolean => {
        if (!isConnected) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        if (!includes([GRBL, GRBLHAL], type)) {
            return false;
        }

        const states = [GRBL_ACTIVE_STATE_IDLE];

        return includes(states, activeState);
    };

    const onStoreChange = ({ workspace }: { workspace: BasicObject }) => {
        const probeProfile: ProbeProfile = get(workspace, 'probeProfile', null);

        if (probeProfile) {
            if (probeProfile.touchplateType === TOUCHPLATE_TYPE_ZERO) {
                actions.handleProbeCommandChange(0);
            }
        }

        setUnits(store.get('workspace.units'));
        setAvailableTools(store.get('workspace.tools', []));
        setTouchplateType(store.get('workspace.probeProfile.touchplateType'));
        setTouchplate(store.get('workspace.probeProfile', {}));
        setDirection(config.get('direction', 0));
        // setProbeAxis(config.get('probeAxis', 'Z'));
        setProbeCommand(config.get('probeCommand', 'G38.2'));
        setUseTLO(config.get('useTLO'));
        setProbeDepth(config.get('probeDepth') || {});
        setProbeFeedrate(config.get('probeFeedrate') || {});
        setProbeFastFeedrate(config.get('probeFastFeedrate') || {});
        setTouchPlateHeight(config.get('touchPlateHeight') || {});
        setRetractionDistance(config.get('retractionDistance') || {});
        setZProbeDistance(config.get('zProbeDistance') || {});
        setConnectivityTest(config.get('connectivityTest'));

        setToolDiameter(calcToolDiamater());

        let newZProbeDistance = config.get('zProbeDistance');
        if (newZProbeDistance) {
            PROBE_DISTANCE_METRIC.z = newZProbeDistance;
            PROBE_DISTANCE_IMPERIAL.z = convertToImperial(newZProbeDistance);
        }
    };

    const state: State = {
        show: modalIsOpen,
        connectionMade: connectionMade,
        canClick: canClick(),
        availableProbeCommands: availableProbeCommands,
        selectedProbeCommand: selectedProbeCommand,
        touchplate: touchplate,
        toolDiameter: toolDiameter,
        availableTools: availableTools,
        units: units,
        direction: direction,
        probeType: probeType,
        connectivityTest: connectivityTest,
    };

    return (
        <>
            <div className="relative">
                <RunProbe state={state} actions={actions} />
                <Probe state={state} actions={actions} />
            </div>
        </>
    );
};

const ProbeWrapper = () => {
    return (
        <WidgetConfigProvider widgetId="probe">
            <ProbeWidget />
        </WidgetConfigProvider>
    );
};

export default ProbeWrapper;
