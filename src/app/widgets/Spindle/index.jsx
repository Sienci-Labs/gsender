import classNames from 'classnames';
import includes from 'lodash/includes';
import debounce from 'lodash/debounce';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import WidgetConfig from '../WidgetConfig';
import {
    // Grbl
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBL_ACTIVE_STATE_HOLD,
    // Marlin
    MARLIN,
    // Smoothie
    SMOOTHIE,
    SMOOTHIE_ACTIVE_STATE_IDLE,
    SMOOTHIE_ACTIVE_STATE_HOLD,
    // TinyG
    TINYG,
    TINYG_MACHINE_STATE_READY,
    TINYG_MACHINE_STATE_STOP,
    TINYG_MACHINE_STATE_END,
    TINYG_MACHINE_STATE_HOLD,
    // Workflow
    WORKFLOW_STATE_RUNNING,
    SPINDLE_MODE,
    LASER_MODE
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
            } else {
                this.setState({
                    mode: LASER_MODE
                });
                this.enableLaserMode();
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
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'workflow:state': (workflowState) => {
            this.setState(state => ({
                workflow: {
                    state: workflowState
                }
            }));
        },
        'controller:state': (type, state) => {
            // Grbl
            if (type === GRBL) {
                const { parserstate } = { ...state };
                const { modal = {} } = { ...parserstate };

                const settings = { ...controller.settings };
                const eepromSettings = settings.settings || {};
                if (Object.keys(eepromSettings).length > 0) {
                    const { $30 = 1000, $31 = 0 } = settings;
                    this.setState({
                        spindleMax: Number($30),
                        spindleMin: Number($31)
                    });
                }

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
        },
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
            laser
        } = this.state;

        this.config.set('laserTest', laser);
        this.config.set('spindleMax', spindleMax);
        this.config.set('mode', mode);
        this.config.set('minimized', minimized);
        this.config.set('speed', spindleSpeed);
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            canClick: true, // Defaults to true
            port: controller.port,
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
            workflow: {
                state: controller.workflow.state
            },
            spindleSpeed: this.config.get('speed', 1000),
            spindleMin: this.config.get('spindleMin', 0),
            spindleMax: this.config.get('spindleMax', 25000),
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
        const { port, workflow } = this.state;
        const controllerType = this.state.controller.type;
        const controllerState = this.state.controller.state;

        if (!port) {
            return false;
        }
        if (workflow.state === WORKFLOW_STATE_RUNNING) {
            return false;
        }
        if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], controllerType)) {
            return false;
        }
        if (controllerType === GRBL) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                GRBL_ACTIVE_STATE_IDLE,
                GRBL_ACTIVE_STATE_HOLD
            ];
            if (!includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === MARLIN) {
            // Marlin does not have machine state
        }
        if (controllerType === SMOOTHIE) {
            const activeState = get(controllerState, 'status.activeState');
            const states = [
                SMOOTHIE_ACTIVE_STATE_IDLE,
                SMOOTHIE_ACTIVE_STATE_HOLD
            ];
            if (!includes(states, activeState)) {
                return false;
            }
        }
        if (controllerType === TINYG) {
            const machineState = get(controllerState, 'sr.machineState');
            const states = [
                TINYG_MACHINE_STATE_READY,
                TINYG_MACHINE_STATE_STOP,
                TINYG_MACHINE_STATE_END,
                TINYG_MACHINE_STATE_HOLD
            ];
            if (!includes(states, machineState)) {
                return false;
            }
        }

        return true;
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

        console.log(state);

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
                            <ActiveIndicator active={active} />
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

export default SpindleWidget;
