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

import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ensureArray from 'ensure-array';
import includes from 'lodash/includes';
import _isEqual from 'lodash/isEqual';
import get from 'lodash/get';

import MachinePositionInput from 'app/widgets/Location/components/MachinePositionInput';
import controller from 'app/lib/controller';
import store from 'app/store';
import { getHomingLocation, getMovementGCode } from 'app/widgets/Location/RapidPosition';
import Modal from 'app/components/Modal';
import combokeys from 'app/lib/combokeys';
import gamepad, { runAction } from 'app/lib/gamepad';

import Panel from './components/Panel';
import PositionLabel from './components/PositionLabel';
import GoToButton from './components/GoToButton';
import Input from '../../containers/Preferences/components/Input';
import {
    AXIS_E,
    AXIS_X,
    AXIS_Y,
    AXIS_Z,
    AXIS_A,
    AXIS_B,
    AXIS_C,
    IMPERIAL_UNITS,
    METRIC_UNITS,
    GRBL_ACTIVE_STATE_IDLE,
    WORKFLOW_STATE_RUNNING,
    GRBL_ACTIVE_STATE_ALARM,
    WORKSPACE_MODE,
    LOCATION_CATEGORY
} from '../../constants';
import styles from './index.styl';
import AxisButton from './components/AxisButton';
import FunctionButton from '../../components/FunctionButton/FunctionButton';
import QuickPositionButton from './components/QuickPositionButton';
import ButtonCollection from '../../components/ButtonCollection/ButtonCollection';
import Switch from '../../components/ToggleSwitch';
import useKeybinding from '../../lib/useKeybinding';

class DisplayPanel extends PureComponent {
    static propTypes = {
        canClick: PropTypes.bool,
        units: PropTypes.oneOf([IMPERIAL_UNITS, METRIC_UNITS]),
        axes: PropTypes.array,
        machinePosition: PropTypes.object,
        workPosition: PropTypes.object,
        jog: PropTypes.object,
        actions: PropTypes.object,
        safeRetractHeight: PropTypes.number,
    };

    actions = {
        jogtoFRCorner: () => {
            const { homingDirection, homingFlag, pullOff } = this.props;
            const gcode = getMovementGCode('FR', homingDirection, homingFlag, pullOff);
            controller.command('gcode', gcode);
        },
        jogtoFLCorner: () => {
            const { homingDirection, homingFlag, pullOff } = this.props;
            const gcode = getMovementGCode('FL', homingDirection, homingFlag, pullOff);
            controller.command('gcode', gcode);
        },
        jogtoBRCorner: () => {
            const { homingDirection, homingFlag, pullOff } = this.props;
            const gcode = getMovementGCode('BR', homingDirection, homingFlag, pullOff);
            controller.command('gcode', gcode);
        },
        jogtoBLCorner: () => {
            const { homingDirection, homingFlag, pullOff } = this.props;
            const gcode = getMovementGCode('BL', homingDirection, homingFlag, pullOff);
            controller.command('gcode', gcode);
        },
        startHoming: () => {
            controller.command('homing');
        },
        startSingleAxisHoming: (axis) => {
            controller.command('homing', axis);
        }
    }

    controllerEvents = {
        'controller:state': (data, controllerState) => {
            let controllersAlarmState = this.state.controllersAlarmState;
            let hardStopAlarm = controllerState.status.alarmCode;
            this.setState(prevState => ({
                controllersAlarmState: hardStopAlarm
            }));
            if (controllersAlarmState === '1') {
                controller.command('gcode:stop', { force: true });
            }
        },
        'controller:settings': (type, controllerSettings) => {
            this.setState(state => ({
                ...state.controller,
                homePosition: controllerSettings.settings.$23
            }));
        },
    }

    shuttleControlEvents = {
        HOMING_GO_TO_BACK_LEFT_CORNER: {
            title: 'Homing - Go to Back Left Corner',
            keys: '',
            cmd: 'HOMING_GO_TO_BACK_LEFT_CORNER',
            payload: {},
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.actions.jogtoBLCorner
        },
        HOMING_GO_TO_BACK_RIGHT_CORNER: {
            title: 'Homing - Go to Back Right Corner',
            keys: '',
            cmd: 'HOMING_GO_TO_BACK_RIGHT_CORNER',
            payload: {},
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.actions.jogtoBRCorner
        },
        HOMING_GO_TO_FRONT_LEFT_CORNER: {
            title: 'Homing - Go to Front Left Corner',
            keys: '',
            cmd: 'HOMING_GO_TO_FRONT_LEFT_CORNER',
            payload: {},
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.actions.jogtoFLCorner
        },
        HOMING_GO_TO_FRONT_RIGHT_CORNER: {
            title: 'Homing - Go to Front Right Corner',
            keys: '',
            cmd: 'HOMING_GO_TO_FRONT_RIGHT_CORNER',
            payload: {},
            preventDefault: true,
            isActive: true,
            category: LOCATION_CATEGORY,
            callback: this.actions.jogtoFRCorner
        },
    }

    componentDidMount() {
        store.on('change', this.updateMachineProfileFromStore);
        this.addControllerEvents();
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);
        gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents }));
    }

    componentWillUnmount() {
        this.removeControllerEvents();
        this.removeShuttleControlEvents();
    }

    addShuttleControlEvents() {
        combokeys.reload();

        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.on(eventName, callback);
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName].callback;
            combokeys.removeListener(eventName, callback);
        });
    }

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    state = {
        controllerAlarmState: null,
        positionInput: {
            [AXIS_E]: false,
            [AXIS_X]: false,
            [AXIS_Y]: false,
            [AXIS_Z]: false,
            [AXIS_A]: false,
            [AXIS_B]: false,
            [AXIS_C]: false
        },
        machineProfile: store.get('workspace.machineProfile'),
        modalShow: false,
        relative: false,
        location: {
            x: 0,
            y: 0,
            z: 0,
            a: 0
        }
    };

    handleSelect = (eventKey) => {
        const commands = ensureArray(eventKey);
        commands.forEach(command => controller.command('gcode', command));
    };

    showPositionInput = (axis) => () => {
        this.setState(state => ({
            positionInput: {
                ...state.positionInput,
                [axis]: true
            }
        }));
    };

    hidePositionInput = (axis) => () => {
        this.setState(state => ({
            positionInput: {
                ...state.positionInput,
                [axis]: false
            }
        }));
    };

    //Only rounds values with more than 3 decimal places which begin with 9
    customMathRound(num) {
        const { $13 } = this.props;
        const DRO = store.get('workspace.customDecimalPlaces', 0);
        const places = $13 === '1' ? 4 : 3; // firmware gives back 3 for metric and 4 for imperial
        const defaultPlaces = $13 === '1' ? 3 : 2; // default places when DRO = 0
        const wholeLength = num.split('.')[0].length;

        let result = num.slice(0, wholeLength + 1 + places); // cut off the javascript weirdness
        if (DRO > places) { // add more 0s
            result = result.padEnd(wholeLength + 1 + DRO, '0'); // +1 for ., +DRO for decimal places
        } else { // remove decimal places (with rounding)
            result = Number(num).toFixed(DRO === 0 ? defaultPlaces : DRO);
        }
        return result;
    }

    renderAxis = (axis, disabled = false, disableGoTo = false) => {
        const { canClick, machinePosition, workPosition, actions, safeRetractHeight, units, homingEnabled } = this.props;
        let mpos = !disabled ? machinePosition[axis] : '0.00';
        const wpos = !disabled ? workPosition[axis] : '0.00';
        const axisLabel = axis.toUpperCase();
        const showPositionInput = canClick && this.state.positionInput[axis];

        return (
            <tr>
                <td className={styles.coordinate}>
                    <GoToButton
                        disabled={!canClick || disabled || disableGoTo}
                        onClick={() => {
                            const commands = [];
                            const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';
                            if (safeRetractHeight !== 0 && axisLabel !== 'Z') {
                                if (homingEnabled) {
                                    // get current Z
                                    const currentZ = Number(machinePosition.z);
                                    const retractHeight = (Math.abs(safeRetractHeight) * -1);
                                    // only move Z if it is less than Z0-SafeHeight
                                    if (currentZ < retractHeight) {
                                        commands.push(`G53 G0 Z${retractHeight}`);
                                    }
                                } else {
                                    commands.push('G91');
                                    commands.push(`G0 Z${safeRetractHeight}`); // Retract Z when moving across workspace
                                }
                            }
                            commands.push(`G90 G0 ${axisLabel}0`); //Move to Work Position Zero
                            // We go down if homing not enabled
                            if (safeRetractHeight !== 0 && axisLabel !== 'Z' && !homingEnabled) {
                                commands.push(`G91 G0 Z${safeRetractHeight * -1}`);
                                commands.push('G90');
                            }
                            controller.command('gcode:safe', commands, modal);
                        }}
                    />
                    <AxisButton axis={axisLabel} onClick={() => actions.setZeroOnAxis(true, axisLabel)} disabled={!canClick || disabled} />
                </td>
                <td className={styles.machinePosition}>
                    <MachinePositionInput
                        disabled={disabled}
                        value={this.customMathRound(wpos)} handleManualMovement={(value) => {
                            actions.handleManualMovement(value, axis);
                        }}
                    />
                    {!showPositionInput && <PositionLabel value={this.customMathRound(mpos)} small />}
                </td>
            </tr>
        );
    };

    /**
     * Function to listen for store changes and re-render accordingly
     */
    updateMachineProfileFromStore = () => {
        const machineProfile = store.get('workspace.machineProfile');

        if (!machineProfile || _isEqual(machineProfile, this.state.machineProfile)) {
            return;
        }

        this.setState({ machineProfile });
    };

    determineSingleAxisHoming() {
        const { homingSetting } = this.props;
        const binary = parseInt(homingSetting, 10).toString(2);
        const singleAxis = binary.charAt(binary.length - 2);
        return Number(singleAxis);
    }

    handleMovementSwitch(newValue) {
        this.setState({ relative: newValue });
    }

    setLocation(value, axis) {
        const { location } = this.state;
        let newLocation = location;
        newLocation[axis] = value;
        this.setState({ location: newLocation });
    }

    handleGoToLocation() {
        const { location, relative } = this.state;
        const { ROTARY } = WORKSPACE_MODE;
        const movement = relative ? 'G91' : 'G90';
        const currentMovement = this.props.modalDistance;
        const isInRotaryMode = store.get('workspace.mode') === ROTARY;

        controller.command('gcode', movement);
        controller.command('gcode', 'G0 X' + location.x + ' Y' + location.y + ' Z' + location.z);

        if (isInRotaryMode) {
            controller.command('gcode', 'G0 A' + location.a);
        }

        controller.command('gcode', currentMovement);
    }

    render() {
        const { axes, actions, canClick, safeRetractHeight, units, homingEnabled, canHome, homingDirection, homingRun, firmware } = this.props;
        const { modalShow, relative, location } = this.state;
        const homingLocation = getHomingLocation(homingDirection);
        const hasAxisX = includes(axes, AXIS_X);
        const hasAxisY = includes(axes, AXIS_Y);
        const hasAxisZ = includes(axes, AXIS_Z);

        const { ROTARY } = WORKSPACE_MODE;
        const isInRotaryMode = store.get('workspace.mode') === ROTARY;

        const singleAxisHoming = this.determineSingleAxisHoming();

        return (
            <>
                <Modal size="xs" show={modalShow} onClose={() => this.setState({ modalShow: false })}>
                    <Modal.Header>
                        <Modal.Title>Go To Location</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className={styles.goToLocationModal}>
                            <Input
                                label="X"
                                units={units}
                                value={location.x}
                                onChange={(e) => this.setLocation(e.target.value, 'x')}
                                additionalProps={{ type: 'number' }}
                            />

                            {!isInRotaryMode && (
                                <Input
                                    label="Y"
                                    units={units}
                                    value={location.y}
                                    onChange={(e) => this.setLocation(e.target.value, 'y')}
                                    additionalProps={{ type: 'number' }}
                                />
                            )}

                            <Input
                                label="Z"
                                units={units}
                                value={location.z}
                                onChange={(e) => this.setLocation(e.target.value, 'z')}
                                additionalProps={{ type: 'number' }}
                            />
                            {
                                isInRotaryMode && (
                                    <Input
                                        label="A"
                                        units="deg"
                                        value={location.a}
                                        onChange={(e) => this.setLocation(e.target.value, 'a')}
                                        additionalProps={{ type: 'number' }}
                                    />
                                )
                            }
                            <div className={styles.switchWrapper}>
                                <div className={ relative ? [styles.grey] : undefined }>Absolute (G90)</div>
                                <Switch
                                    name="movement"
                                    checked={relative}
                                    onChange={() => this.handleMovementSwitch(!relative)}
                                    onColor="#888888"
                                />
                                <div className={ relative ? undefined : [styles.grey] }>Relative (G91)</div>
                            </div>
                            <FunctionButton
                                onClick={() => this.handleGoToLocation()}
                                className={styles.goButton}
                                primary
                            >
                                GO!
                            </FunctionButton>
                        </div>
                    </Modal.Body>
                </Modal>
                <Panel className={styles.displayPanel}>
                    <div className={styles.locationWrapper}>
                        <div className={styles.alwaysAvailable}>
                            <table className={styles.displaypanelTable}>
                                {firmware === 'Grbl'
                                    ? (
                                        <tbody>
                                            {hasAxisX && this.renderAxis(AXIS_X)}
                                            {!isInRotaryMode && hasAxisY ? this.renderAxis(AXIS_Y) : this.renderAxis(AXIS_Y, true)}
                                            {hasAxisZ && this.renderAxis(AXIS_Z, false, isInRotaryMode)}
                                        </tbody>
                                    )
                                    : (
                                        <tbody>
                                            {hasAxisX && this.renderAxis(AXIS_X)}
                                            {hasAxisY && this.renderAxis(AXIS_Y)}
                                            {hasAxisZ && this.renderAxis(AXIS_Z)}
                                        </tbody>
                                    )
                                }
                            </table>
                            <div className={styles.controlButtons}>
                                <FunctionButton
                                    onClick={() => actions.setZeroOnAxis(true, 'all')}
                                    disabled={!canClick}
                                >
                                    <i className="fas fa-bullseye" />
                                    Zero All
                                </FunctionButton>
                                <FunctionButton
                                    onClick={() => {
                                        const modal = (units === METRIC_UNITS) ? 'G21' : 'G20';
                                        if (safeRetractHeight !== 0) {
                                            if (homingEnabled) {
                                                controller.command('gcode:safe', `G53 G0 Z${(Math.abs(safeRetractHeight) * -1)}`, modal);
                                            } else {
                                                controller.command('gcode', 'G91');
                                                controller.command('gcode:safe', `G0 Z${safeRetractHeight}`, modal); // Retract Z when moving across workspace
                                            }
                                        }

                                        controller.command('gcode', 'G90');
                                        controller.command('gcode', 'G0 X0 Y0'); //Move to Work Position Zero
                                    }}
                                    disabled={!canClick}
                                    primary
                                >
                                    <i className="fas fa-chart-line" />
                                    Go {isInRotaryMode ? 'XA0' : 'XY0'}
                                </FunctionButton>
                                <FunctionButton
                                    onClick={() => {
                                        this.setState({
                                            modalShow: true
                                        });
                                    }}
                                    disabled={!canClick}
                                    className={styles.fontMonospace}
                                    primary
                                >
                                    <i className="fas fa-location-arrow" />
                                    Go To
                                </FunctionButton>
                            </div>
                        </div>

                        {
                            homingEnabled && (
                                <div className={styles.endStop}>
                                    {
                                        singleAxisHoming ? (
                                            <>
                                                <div className={styles.homeWrapper}>
                                                    <FunctionButton
                                                        primary
                                                        disabled={!canHome}
                                                        onClick={this.actions.startHoming}
                                                        className={styles.runHomeButton}
                                                    >
                                                        <i className="fas fa-home" /> Home
                                                    </FunctionButton>
                                                </div>
                                                <ButtonCollection
                                                    disabled={!canHome}
                                                    buttons={['X', 'Y', 'Z', 'A']}
                                                    onClick={this.actions.startSingleAxisHoming}
                                                />
                                            </>
                                        ) : (
                                            <FunctionButton
                                                primary
                                                disabled={!canHome}
                                                onClick={this.actions.startHoming}
                                                className={styles.runHomeButton}
                                            >
                                                <i className="fas fa-home" /> Home
                                            </FunctionButton>
                                        )
                                    }
                                    <div className={styles.endStopActiveControls}>
                                        <QuickPositionButton
                                            disabled={!canClick || !homingRun}
                                            className={styles.QPBL}
                                            onClick={() => {
                                                this.actions.jogtoBLCorner();
                                            }}
                                            icon={(homingLocation === 'BL') ? 'fa-home' : 'fa-arrow-circle-up'}
                                        />
                                        <QuickPositionButton
                                            disabled={!canClick || !homingRun}
                                            className={styles.QPBR}
                                            rotate={45}
                                            onClick={() => {
                                                this.actions.jogtoBRCorner();
                                            }}
                                            icon={(homingLocation === 'BR') ? 'fa-home' : 'fa-arrow-circle-up'}
                                        />
                                        <QuickPositionButton
                                            disabled={!canClick || !homingRun}
                                            className={styles.QPFL}
                                            onClick={() => {
                                                this.actions.jogtoFLCorner();
                                            }}
                                            icon={(homingLocation === 'FL') ? 'fa-home' : 'fa-arrow-circle-up'}
                                        />
                                        <QuickPositionButton
                                            disabled={!canClick || !homingRun}
                                            className={styles.QPFR}
                                            onClick={() => {
                                                this.actions.jogtoFRCorner();
                                            }}
                                            icon={(homingLocation === 'FR') ? 'fa-home' : 'fa-arrow-circle-up'}
                                        />
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </Panel>
            </>
        );
    }
}

export default connect((store) => {
    const homingSetting = get(store, 'controller.settings.settings.$22', '0');
    const homingDirection = get(store, 'controller.settings.settings.$23', '0');
    const pullOff = get(store, 'controller.settings.settings.$27', '1');
    const homingFlag = get(store, 'controller.homingFlag', false);
    const homingRun = get(store, 'controller.homingRun', false);
    const homingEnabled = homingSetting !== '0';
    const isConnected = get(store, 'connection.isConnected');
    const workflowState = get(store, 'controller.workflow.state');
    const activeState = get(store, 'controller.state.status.activeState');
    const canHome = isConnected && [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_ALARM].includes(activeState) && workflowState !== WORKFLOW_STATE_RUNNING;
    const mpos = get(store, 'controller.mpos');
    const firmware = get(store, 'controller.type');
    const modalDistance = get(store, 'controller.state.parserstate.modal.distance');
    const $13 = get(store, 'controller.settings.settings.$13');
    return {
        homingSetting,
        homingEnabled,
        canHome,
        homingDirection,
        homingFlag,
        homingRun,
        pullOff,
        mpos,
        firmware,
        modalDistance,
        $13
    };
})(DisplayPanel);
