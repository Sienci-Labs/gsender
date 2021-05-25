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

import classNames from 'classnames';
import includes from 'lodash/includes';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';
import { connect } from 'react-redux';
import React, { PureComponent } from 'react';
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

    // Public methods
    collapse = () => {
        this.setState({ minimized: true });
    };

    expand = () => {
        this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

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

            this.setActive();
        },
        sendM4: () => {
            const { spindleSpeed, mode } = this.state;
            if (mode === LASER_MODE || spindleSpeed === 0) {
                controller.command('gcode', 'M4');
            } else {
                controller.command('gcode', `M4 S${spindleSpeed}`);
            }
            this.setActive();
        },
        sendM5: () => {
            controller.command('gcode', 'M5');
            this.setInactive();
        },
        handleSpindleSpeedChange: (e) => {
            const value = Number(e.target.value) || 0;
            this.setState({
                spindleSpeed: value
            });
            //this.debouncedSpindleOverride(value);
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
            const { laser, spindleMax } = this.state;
            const { power, duration } = laser;
            this.setState({
                active: true
            });
            controller.command('lasertest:on', power, duration, spindleMax);
            setTimeout(() => {
                this.setState({
                    active: false
                });
            }, laser.duration);
        }
    };

    controllerEvents = {
        'controller:settings': (type, controllerSettings) => {
            const { settings } = controllerSettings;
            if (Object.keys(settings).length > 0) {
                const { $30, $31 } = settings;
                this.setState({
                    spindleMax: Number($30),
                    spindleMin: Number($31)
                });
            }
        },
        /*'controller:state': (type, state) => {
            // Grbl
            if (type === GRBL) {
                const { parserstate } = { ...state };
                const { modal = {} } = { ...parserstate };
                this.setState({
                    controller: {
                        type: type,
                        state: state,
                        modal: {
                            spindle: modal.spindle || '',
                            coolant: modal.coolant || ''
                        }
                    }
                });
            }
        },*/
    };

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
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

        this.config.set('laserTest', laser);
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
            active: false,
            controller: {
                type: controller.type,
                state: controller.state,
                modal: {
                    spindle: '',
                    coolant: ''
                }
            },
            spindleSpeed: this.config.get('speed', 1000),
            spindleMin: this.config.get('spindleMin', 0),
            spindleMax: this.config.get('spindleMax', 5000),
            laser: this.config.get('laserTest')
        };
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

    setActive() {
        this.setState({
            active: true
        });
    }

    setInactive() {
        this.setState({
            active: false
        });
    }

    enableSpindleMode() {
        const { active } = this.state;
        if (active) {
            controller.command('gcode', 'M5');
            this.setInactive();
        }
        controller.command('gcode', '$32=0');
    }

    debouncedSpindleOverride = debounce((spindleSpeed) => {
        controller.command('spindleOverride', spindleSpeed);
    }, 250);

    enableLaserMode() {
        const { active } = this.state;
        if (active) {
            controller.command('gcode', 'M5');
            this.setInactive();
        }
        controller.command('gcode', '$32=1');
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
        const { embedded } = this.props;
        const { minimized, isFullscreen } = this.state;
        const state = {
            ...this.state,
            canClick: this.canClick()
        };
        const actions = {
            ...this.actions
        };

        const { active } = state;

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
                            <ModalToggle mode={state.mode} onChange={actions.handleModeToggle} />
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
    return {
        workflow,
        isConnected,
        state,
        type
    };
})(SpindleWidget);
