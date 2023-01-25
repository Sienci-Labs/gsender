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
import classNames from 'classnames';
import includes from 'lodash/includes';
import reduxStore from 'app/store/redux';
import * as controllerActions from 'app/actions/controllerActions';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import { connect } from 'react-redux';
import gamepad, { runAction } from 'app/lib/gamepad';
import combokeys from 'app/lib/combokeys';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import WidgetConfig from '../WidgetConfig';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    LASER_MODE,
    SPINDLE_LASER_CATEGORY,
    SPINDLE_MODE,
    WORKFLOW_STATE_RUNNING
} from '../../constants';
import styles from './index.styl';
import SpindleControls from './components/SpindleControls';
import LaserControls from './components/LaserControls';
import ModalToggle from './components/ModalToggle';
import ActiveIndicator from './components/ActiveIndicator';
import useKeybinding from '../../lib/useKeybinding';


class SpindleWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object,
        embedded: PropTypes.bool
    };

    shuttleControlEvents = {
        TOGGLE_SPINDLE_LASER_MODE: {
            id: 51,
            title: 'Toggle Mode',
            keys: '',
            cmd: 'TOGGLE_SPINDLE_LASER_MODE',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                this.actions.handleModeToggle();
            }
        },
        CW_LASER_ON: {
            id: 52,
            title: 'CW / Laser On',
            keys: '',
            cmd: 'CW_LASER_ON',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                this.state.mode === LASER_MODE
                    ? this.actions.sendLaserM3()
                    : this.actions.sendM3();
            }
        },
        CCW_LASER_TEST: {
            id: 53,
            title: 'CCW / Laser Test',
            keys: '',
            cmd: 'CCW_LASER_TEST',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                this.state.mode === LASER_MODE
                    ? this.actions.runLaserTest()
                    : this.actions.sendM4();
            }
        },
        STOP_LASER_OFF: {
            id: 54,
            title: 'Stop / Laser Off',
            keys: '',
            cmd: 'STOP_LASER_OFF',
            preventDefault: false,
            isActive: true,
            category: SPINDLE_LASER_CATEGORY,
            callback: () => {
                this.actions.sendM5();
            }
        },
    }

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    pubsubTokens = [];

    isLaserOn = false;

    actions = {
        handleModeToggle: () => {
            const { mode } = this.state;
            if (mode === LASER_MODE) {
                this.setState({
                    mode: SPINDLE_MODE
                });
                this.enableSpindleMode();
                pubsub.publish('spindle:mode', SPINDLE_MODE);
            } else {
                this.setState({
                    mode: LASER_MODE
                });
                this.enableLaserMode();
                pubsub.publish('spindle:mode', LASER_MODE);
            }
        },
        sendM3: () => {
            const { spindleSpeed, mode } = this.state;
            this.isSpindleOn = true;
            if (mode === LASER_MODE || spindleSpeed === 0) {
                controller.command('gcode', 'M3');
            } else {
                controller.command('gcode', `M3 S${spindleSpeed}`);
            }
        },
        sendM4: () => {
            const { spindleSpeed, mode } = this.state;
            this.isSpindleOn = true;
            if (mode === LASER_MODE || spindleSpeed === 0) {
                controller.command('gcode', 'M4');
            } else {
                controller.command('gcode', `M4 S${spindleSpeed}`);
            }
        },
        sendM5: () => {
            this.isLaserOn = false;
            this.isSpindleOn = false;
            controller.command('gcode', 'M5 S0');
        },
        sendLaserM3: () => {
            const { laser } = this.state;
            const { power } = laser;
            const laserPower = laser.maxPower * (power / 100);
            this.isLaserOn = true;

            controller.command('gcode', `G1F1 M3 S${laserPower}`);
        },
        handleSpindleSpeedChange: (e) => {
            const value = Number(e.target.value);
            if (this.isSpindleOn) {
                this.debounceSpindleSpeed(value);
            }
            this.setState({
                spindleSpeed: value
            });
        },
        handleLaserPowerChange: (e) => {
            const { laser } = this.state;
            const { power, maxPower } = laser;
            const value = Number(e.target.value);
            if (this.isLaserOn) {
                this.debounceLaserPower(power, maxPower);
            }
            this.setState({
                laser: {
                    ...laser,
                    power: value
                }
            });
        },
        handleLaserDurationChange: (e) => {
            const { laser } = this.state;
            let value = Number(e.target.value) || 0;
            value = Math.abs(value);
            this.setState({
                laser: {
                    ...laser,
                    duration: value
                }
            });
        },
        runLaserTest: () => {
            const { laser } = this.state;
            const { power, duration, maxPower } = laser;

            controller.command('lasertest:on', power, duration, maxPower);
            setTimeout(() => {
                this.setState({
                    active: false
                });
            }, laser.duration);
        }
    };

    subscribe() {
        const tokens = [
            pubsub.subscribe('laser:updated', (msg, data) => {
                const { laser } = this.state;

                this.setState({ laser: { ...laser, ...data } });
            }),
            pubsub.subscribe('spindle:updated', (msg, data) => {
                this.setState({ spindleMax: data.spindleMax, spindleMin: data.spindleMin });
            }),
        ];

        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
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

    componentDidMount() {
        this.subscribe();
        this.addShuttleControlEvents();
        useKeybinding(this.shuttleControlEvents);

        gamepad.on('gamepad:button', (event) => runAction({ event, shuttleControlEvents: this.shuttleControlEvents }));
    }

    componentWillUnmount() {
        this.unsubscribe();
        this.removeShuttleControlEvents();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized,
            spindleSpeed,
            mode,
            laser
        } = this.state;

        this.config.set('laser.duration', laser.duration);
        this.config.set('laser.power', laser.power);
        this.config.set('mode', mode);
        this.config.set('minimized', minimized);
        this.config.set('speed', spindleSpeed);
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            mode: this.config.get('mode'),
            spindleSpeed: this.config.get('speed', 1000),
            laser: this.config.get('laser'),
            spindleMax: this.config.get('spindleMax'),
            spindleMin: this.config.get('spindleMin')
        };
    }

    enableSpindleMode() {
        const active = this.getSpindleActiveState();
        if (active) {
            this.isSpindleOn = false;
            controller.command('gcode', 'M5');
            //this.setInactive();
        }
        const spindleMin = this.config.get('spindleMin');
        const spindleMax = this.config.get('spindleMax');
        const commands = [
            ...this.getSpindleOffsetCode(),
            `$30=${spindleMax}`,
            `$31=${spindleMin}`,
            '$32=0'
        ];
        this.updateControllerSettings(spindleMax, spindleMin, 0);
        controller.command('gcode', commands);
    }

    debouncedSpindleOverride = debounce((spindleSpeed) => {
        controller.command('spindleOverride', spindleSpeed);
    }, 250);

    debounceLaserPower = debounce((power, maxPower) => {
        controller.command('laserpower:change', power, maxPower);
    }, 300);

    debounceSpindleSpeed = debounce((speed) => {
        controller.command('spindlespeed:change', speed);
    }, 300);

    updateControllerSettings(max, min, mode) {
        reduxStore.dispatch({
            type: controllerActions.UPDATE_PARTIAL_CONTROLLER_SETTINGS,
            payload: {
                $30: max,
                $31: min,
                $32: `${mode}`
            }
        });
    }

    getWCS() {
        const { wcs } = this.props;
        const p = {
            'G54': 1,
            'G55': 2,
            'G56': 3,
            'G57': 4,
            'G58': 5,
            'G59': 6
        }[wcs] || 0;
        return p;
    }

    // Take into account the current wpos when setting offsets
    calculateAdjustedOffsets(xOffset, yOffset) {
        const { wpos } = this.props;
        const { x, y } = wpos;
        return [Number(x) + Number(xOffset), Number(y) + Number(yOffset)];
    }

    getLaserOffsetCode() {
        const laser = this.config.get('laser');


        this.setState({
            laser
        });
        const { xOffset, yOffset } = laser;
        const [xoffsetAdjusted, yOffsetAdjusted] = this.calculateAdjustedOffsets(xOffset, yOffset);

        let offsetQuery = [];
        if (xOffset === 0 && yOffset !== 0) {
            offsetQuery = [
                `G10 L20 P${this.getWCS()} Y${yOffsetAdjusted}`
            ];
        } else if (xOffset !== 0 && yOffset === 0) {
            offsetQuery = [
                `G10 L20 P${this.getWCS()} X${xoffsetAdjusted}`
            ];
        } else if (xOffset !== 0 && yOffset !== 0) {
            offsetQuery = [`G10 L20 P${this.getWCS()} X${xoffsetAdjusted} Y${yOffsetAdjusted}`];
        } else {
            offsetQuery = [''];
        }
        return offsetQuery;
    }

    getSpindleOffsetCode() {
        const laser = this.config.get('laser');
        this.setState({
            laser
        });
        let offsetQuery = [];
        let { xOffset, yOffset } = laser;
        xOffset = Number(xOffset) * -1;
        yOffset = Number(yOffset) * -1;
        const [xoffsetAdjusted, yOffsetAdjusted] = this.calculateAdjustedOffsets(xOffset, yOffset);
        if (xOffset === 0 && yOffset !== 0) {
            offsetQuery = [
                `G10 L20 P${this.getWCS()} Y${yOffsetAdjusted}`
            ];
        } else if (xOffset !== 0 && yOffset === 0) {
            offsetQuery = [`G10 L20 P${this.getWCS()} X${xoffsetAdjusted}`];
        } else if (xOffset !== 0 && yOffset !== 0) {
            offsetQuery = [`G10 L20 P${this.getWCS()} X${xoffsetAdjusted} Y${yOffsetAdjusted}`];
        } else {
            offsetQuery = [''];
        }
        return offsetQuery;
    }


    enableLaserMode() {
        const active = this.getSpindleActiveState();
        const laser = this.config.get('laser');

        const { minPower, maxPower } = laser;
        if (active) {
            this.isLaserOn = false;
            controller.command('gcode', 'M5');
        }
        const commands = [
            ...this.getLaserOffsetCode(),
            `$30=${maxPower}`,
            `$31=${minPower}`,
            '$32=1'
        ];
        this.updateControllerSettings(maxPower, minPower, 1);
        controller.command('gcode', commands);
    }

    getSpindleActiveState() {
        const { spindleModal } = this.props;
        return spindleModal !== 'M5';
    }

    canClick() {
        const { workflow, isConnected, state, type } = this.props;

        if (!isConnected) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        if (!includes([GRBL], type)) {
            return false;
        }

        const activeState = get(state, 'status.activeState');
        const states = [
            GRBL_ACTIVE_STATE_IDLE,
        ];

        return includes(states, activeState);
    }

    render() {
        const { embedded, spindleModal } = this.props;
        const { minimized, isFullscreen, spindleMin, spindleMax } = this.state;
        const state = {
            ...this.state,
            spindleModal,
            spindleMin,
            spindleMax,
            canClick: this.canClick(),
        };
        const actions = {
            ...this.actions
        };

        const active = this.getSpindleActiveState();

        return (
            <Widget fullscreen={isFullscreen}>
                <Widget.Header embedded={embedded} />
                <Widget.Content
                    className={classNames(
                        styles['widget-content'],
                        styles.heightOverride,
                        { [styles.hidden]: minimized }
                    )}
                >
                    <div>
                        <div className={styles.modalRow}>
                            <ModalToggle mode={state.mode} onChange={actions.handleModeToggle} disabled={!this.canClick()} />
                            <ActiveIndicator canClick={this.canClick()} active={active} />
                        </div>
                        <div>
                            {
                                (state.mode === SPINDLE_MODE)
                                    ? <SpindleControls state={state} actions={actions} />
                                    : <LaserControls state={state} actions={actions} />
                            }
                        </div>
                    </div>
                </Widget.Content>
            </Widget>
        );
    }
}

export default connect((store) => {
    const workflow = get(store, 'controller.workflow');
    const state = get(store, 'controller.state');
    const isConnected = get(store, 'connection.isConnected');
    const type = get(store, 'controller.type');
    const spindleModal = get(store, 'controller.modal.spindle', 'M5');
    const settings = get(store, 'controller.settings');
    const spindleMin = Number(get(settings, 'settings.$31', 1000));
    const spindleMax = Number(get(settings, 'settings.$30', 30000));
    const wcs = get(store, 'controller.modal.wcs');
    const wpos = get(store, 'controller.wpos', {});

    return {
        workflow,
        isConnected,
        state,
        type,
        spindleModal,
        settings,
        spindleMin,
        spindleMax,
        wcs,
        wpos
    };
})(SpindleWidget);
