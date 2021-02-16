import ensureArray from 'ensure-array';
import includes from 'lodash/includes';
import _isEqual from 'lodash/isEqual';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import store from 'app/store';

import Panel from './components/Panel';
import PositionLabel from './components/PositionLabel';

import {
    AXIS_E,
    AXIS_X,
    AXIS_Y,
    AXIS_Z,
    AXIS_A,
    AXIS_B,
    AXIS_C,
    IMPERIAL_UNITS,
    METRIC_UNITS
} from '../../constants';
import styles from './index.styl';

import AxisButton from './components/AxisButton';
import ControlButton from './components/ControlButton';

import BullseyeIcon from './icons/Bullseye';
import ChartIcon from './icons/Chart';
import HomeIcon from './icons/Home';

import { PRIMARY_COLOR, SECONDARY_COLOR } from './constants';
import Release from './icons/Release';

class DisplayPanel extends PureComponent {
    static propTypes = {
        canClick: PropTypes.bool,
        units: PropTypes.oneOf([IMPERIAL_UNITS, METRIC_UNITS]),
        axes: PropTypes.array,
        machinePosition: PropTypes.object,
        workPosition: PropTypes.object,
        jog: PropTypes.object,
        actions: PropTypes.object
    };

    state = {
        positionInput: {
            [AXIS_E]: false,
            [AXIS_X]: false,
            [AXIS_Y]: false,
            [AXIS_Z]: false,
            [AXIS_A]: false,
            [AXIS_B]: false,
            [AXIS_C]: false
        },
        machineProfile: store.get('workspace.machineProfile')
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

    renderAxis = (axis) => {
        const { canClick, machinePosition, workPosition, actions } = this.props;
        const mpos = machinePosition[axis] || '0.000';
        const wpos = workPosition[axis] || '0.000';
        const axisLabel = axis.toUpperCase();
        const showPositionInput = canClick && this.state.positionInput[axis];

        //Function to zero out given axis
        const handleAxisButtonClick = () => {
            const wcs = actions.getWorkCoordinateSystem();

            const p = {
                'G54': 1,
                'G55': 2,
                'G56': 3,
                'G57': 4,
                'G58': 5,
                'G59': 6
            }[wcs] || 0;

            controller.command('gcode', `G10 L20 P${p} ${axisLabel}0`);
        };

        return (
            <tr>
                <td className={styles.coordinate}>
                    <AxisButton axis={axisLabel} onClick={handleAxisButtonClick} disabled={!canClick} />
                </td>
                <td className={styles.machinePosition}>
                    <PositionLabel value={wpos} />
                    {!showPositionInput && <PositionLabel value={mpos} small /> }
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

    componentDidMount() {
        store.on('change', this.updateMachineProfileFromStore);
    }

    render() {
        const { axes, actions, canClick } = this.props;
        const hasAxisX = includes(axes, AXIS_X);
        const hasAxisY = includes(axes, AXIS_Y);
        const hasAxisZ = includes(axes, AXIS_Z);
        const machineProfile = this.state.machineProfile;

        return (
            <Panel className={styles.displayPanel}>
                <div className={styles.locationWrapper}>
                    <table>
                        <tbody>
                            {hasAxisX && this.renderAxis(AXIS_X)}
                            {hasAxisY && this.renderAxis(AXIS_Y)}
                            {hasAxisZ && this.renderAxis(AXIS_Z)}
                        </tbody>
                    </table>

                    <div className={styles.controlButtons}>
                        <ControlButton
                            icon={() => <BullseyeIcon fill={canClick ? PRIMARY_COLOR : SECONDARY_COLOR} />}
                            label={i18n._('Zero All')}
                            onClick={() => {
                                const wcs = actions.getWorkCoordinateSystem();

                                const p = {
                                    'G54': 1,
                                    'G55': 2,
                                    'G56': 3,
                                    'G57': 4,
                                    'G58': 5,
                                    'G59': 6
                                }[wcs] || 0;

                                controller.command('gcode', `G10 L20 P${p} X0 Y0 Z0`);
                            }}
                            disabled={!canClick}
                        />
                        <ControlButton
                            label={i18n._('Go to Zero')}
                            icon={() => <ChartIcon fill={(canClick) ? PRIMARY_COLOR : SECONDARY_COLOR} />}
                            onClick={() => {
                                controller.command('gcode', 'G91');
                                controller.command('gcode:safe', 'G0 Z10', 'G21'); // Retract Z when moving across workspace
                                controller.command('gcode', 'G90');
                                controller.command('gcode', 'G0 X0 Y0'); //Move to Work Position Zero
                                controller.command('gcode', 'G0 Z0'); // Move Z up
                            }}
                            disabled={!canClick}
                        />
                        <ControlButton
                            label={i18n._('Home')}
                            icon={() => <HomeIcon fill={(canClick && machineProfile.endstops) ? PRIMARY_COLOR : SECONDARY_COLOR} />}
                            onClick={() => {
                                controller.command('homing');
                            }}
                            disabled={!canClick || !machineProfile.endstops}
                        />
                        <ControlButton
                            label={i18n._('Go Home')}
                            icon={() => <ChartIcon fill={(canClick && machineProfile.endstops) ? PRIMARY_COLOR : SECONDARY_COLOR} />}
                            onClick={() => {
                                controller.command('gcode', 'G28 G91'); //Go to Home Position
                            }}
                            disabled={!canClick || !machineProfile.endstops}
                        />
                        <ControlButton
                            label={i18n._('Release')}
                            icon={() => <Release fill={(canClick) ? PRIMARY_COLOR : SECONDARY_COLOR} />}
                            onClick={() => {
                                controller.command('unlock');
                            }}
                            disabled={!canClick}
                        />
                    </div>
                </div>
            </Panel>
        );
    }
}

export default DisplayPanel;
