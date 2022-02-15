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
    GRBL_ACTIVE_STATE_HOLD,
    GRBL_ACTIVE_STATE_IDLE,
    LASER_MODE,
    MARLIN,
    SMOOTHIE,
    SPINDLE_MODE,
    TINYG,
    WORKFLOW_STATE_RUNNING
} from '../../constants';
import styles from './index.styl';
import SpindleControls from './components/SpindleControls';
import LaserControls from './components/LaserControls';
import ModalToggle from './components/ModalToggle';
import ActiveIndicator from './components/ActiveIndicator';


class SpindleWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object,
        embedded: PropTypes.bool
    };

    shuttleControlEvents = {
        TOGGLE_SPINDLE_LASER_MODE: () => {
            this.actions.handleModeToggle();
        },
        CW_LASER_ON: () => {
            this.state.mode === LASER_MODE
                ? this.actions.sendLaserM3()
                : this.actions.sendM3();
        },
        CCW_LASER_TEST: () => {
            this.state.mode === LASER_MODE
                ? this.actions.runLaserTest()
                : this.actions.sendM4();
        },
        STOP_LASER_OFF: () => {
            this.actions.sendM5();
        }
    }

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };

    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    pubsubTokens = [];

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
            if (mode === LASER_MODE || spindleSpeed === 0) {
                controller.command('gcode', 'M3');
            } else {
                controller.command('gcode', `M3 S${spindleSpeed}`);
            }
        },
        sendM4: () => {
            const { spindleSpeed, mode } = this.state;
            if (mode === LASER_MODE || spindleSpeed === 0) {
                controller.command('gcode', 'M4');
            } else {
                controller.command('gcode', `M4 S${spindleSpeed}`);
            }
        },
        sendM5: () => {
            controller.command('gcode', 'M5 S0');
        },
        sendLaserM3: () => {
            const { laser } = this.state;
            const { power } = laser;
            const laserPower = laser.maxPower * (power / 100);

            controller.command('gcode', `G1F1 M3 S${laserPower}`);
        },
        handleSpindleSpeedChange: (e) => {
            const value = Number(e.target.value);
            this.setState({
                spindleSpeed: value
            });
        },
        handleLaserPowerChange: (e) => {
            const { laser } = this.state;
            const value = Number(e.target.value);
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
            const callback = this.shuttleControlEvents[eventName];
            combokeys.on(eventName, callback);
        });
    }

    removeShuttleControlEvents() {
        Object.keys(this.shuttleControlEvents).forEach(eventName => {
            const callback = this.shuttleControlEvents[eventName];
            combokeys.removeListener(eventName, callback);
        });
    }

    componentDidMount() {
        this.subscribe();
        this.addShuttleControlEvents();

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
            spindleMax,
            spindleMin,
            laser
        } = this.state;

        this.config.set('laser', laser);
        this.config.set('spindleMax', spindleMax);
        this.config.set('spindleMin', spindleMin);
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
            spindleMax: this.props.spindleMax,
            spindleMin: this.props.spindleMin
        };
    }

    enableSpindleMode() {
        const active = this.getSpindleActiveState();
        if (active) {
            controller.command('gcode', 'M5');
            this.setInactive();
        }
        const spindleMin = this.config.get('spindleMin');
        const spindleMax = this.config.get('spindleMax');
        const commands = [
            `$30=${spindleMax}`,
            `$31=${spindleMin}`,
            '$32=0'
        ];
        controller.command('gcode', commands);
    }

    debouncedSpindleOverride = debounce((spindleSpeed) => {
        controller.command('spindleOverride', spindleSpeed);
    }, 250);

    enableLaserMode() {
        const { active } = this.state;
        const laser = this.config.get('laser');

        const { minPower, maxPower } = laser;
        if (active) {
            controller.command('gcode', 'M5');
        }
        const commands = [
            `$30=${minPower}`,
            `$31=${maxPower}`,
            '$32=1'
        ];
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
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], type)) {
            return false;
        }

        const activeState = get(state, 'status.activeState');
        const states = [
            GRBL_ACTIVE_STATE_IDLE,
            GRBL_ACTIVE_STATE_HOLD
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
                <Widget.Header embedded={embedded}>
                </Widget.Header>
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
    const spindleMin = Number(get(settings, 'settings.$31', 0));
    const spindleMax = Number(get(settings, 'settings.$30', 2000));

    return {
        workflow,
        isConnected,
        state,
        type,
        spindleModal,
        settings,
        spindleMin,
        spindleMax
    };
})(SpindleWidget);
