import classNames from 'classnames';
import mapValues from 'lodash/mapValues';
import pubsub from 'pubsub-js';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
// import i18n from 'app/lib/i18n';
import { mapPositionToUnits } from 'app/lib/units';
import WidgetConfig from '../WidgetConfig';
import JobStatus from './JobStatus';
import {
    GRBL,
    // Units
    IMPERIAL_UNITS,
    METRIC_UNITS,
    WORKFLOW_STATE_IDLE,
    WORKFLOW_STATE_PAUSED
} from '../../constants';
import styles from './index.styl';

class JobStatusWidget extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
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
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = this.state;
            this.setState({
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            });
        },
        toggleMinimized: () => {
            const { minimized } = this.state;
            this.setState({ minimized: !minimized });
        },
    };

    controllerEvents = {
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({
                port: port,
                connected: true,
            });
        },
        'serialport:close': (options) => {
            const initialState = this.getInitialState();
            this.setState({ ...initialState });
        },
        'gcode:unload': () => {
            this.setState({
                bbox: {
                    min: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    max: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    delta: {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                }
            });
        },
        'sender:status': (data) => {
            const { total, sent, received, startTime, finishTime, elapsedTime, remainingTime, name } = data;

            this.setState({
                total,
                sent,
                received,
                startTime,
                finishTime,
                fileName: name,
                elapsedTime,
                remainingTime,
                workflow: {
                    state: controller.workflow.state
                },
            });
        },
        'controller:state': (type, state) => {
            // Grbl
            if (type === GRBL) {
                const { parserstate } = { ...state };
                const { modal = {} } = { ...parserstate };
                const units = {
                    'G20': IMPERIAL_UNITS,
                    'G21': METRIC_UNITS
                }[modal.units] || this.state.units;

                let unitsState = {};
                if (this.state.units !== units) {
                    unitsState = { units: units };
                }

                this.setState(prevState => ({
                    controller: {
                        ...prevState.controller,
                        type: type,
                        state: { ...state, ...unitsState }
                    }
                }));
            }
            // // Grbl
            // if (type === GRBL) {
            //     const { parserstate } = { ...state };
            //     const { modal = {} } = { ...parserstate };
            //     const units = {
            //         'G20': IMPERIAL_UNITS,
            //         'G21': METRIC_UNITS
            //     }[modal.units] || this.state.units;

            //     let unitsState = {};
            //     if (this.state.units !== units) {
            //         unitsState = { units: units };
            //     }

            //     const { activeState } = state.status;

            //     //Set the paused time once the machine is paused
            //     if (activeState === 'Hold') {
            //         this.setState(prevState => ({
            //             controller: {
            //                 ...prevState.controller,
            //                 type: type,
            //                 state: { ...state }
            //             },
            //             ...unitsState,
            //             pausedTime: Date.now()
            //         }));

            //     // Set the paused time back to 0 when machine is idle
            //     } else if (activeState === 'Idle') {
            //         this.setState(prevState => ({
            //             controller: {
            //                 ...prevState.controller,
            //                 type: type,
            //                 state: { ...state }
            //             },
            //             ...unitsState,
            //             pausedTime: 0,
            //         }));

            //     // Calculate the time difference from the paused time to current time
            //     // then subtract it from the elapsed time given by the machine
            //     } else {
            //         const { pausedTime, elapsedTime, controller: { state: prevState } } = this.state;

            //         // If the previous state of the machine was on hold, perform the calculation
            //         if (prevState.status.activeState !== 'Run') {
            //             const now = Date.now();

            //             const diff = pausedTime === 0 ? pausedTime : now - pausedTime;

            //             this.setState(prevState => ({
            //                 controller: {
            //                     ...prevState.controller,
            //                     type: type,
            //                     state: { ...state }
            //                 },
            //                 ...unitsState,
            //                 elapsedTime: elapsedTime - diff,
            //                 pausedTime: 0,
            //             }));
            //         } else {
            //             this.setState(prevState => ({
            //                 controller: {
            //                     ...prevState.controller,
            //                     type: type,
            //                     state: { ...state },
            //                 },
            //                 ...unitsState,
            //             }));
            //         }
            //     }
            // }
        }
    };

    pubsubTokens = [];

    componentDidMount() {
        this.subscribe();
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            minimized,
            spindleSpeed,
            probeFeedrate,
        } = this.state;

        this.config.set('minimized', minimized);
        this.config.set('speed', spindleSpeed);
        this.config.set('probeFeedrate', Number(probeFeedrate));
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            spindleSpeed: this.config.get('speed', 1000),
            probeFeedrate: Number(this.config.get('probeFeedrate') || 0).toFixed(3) * 1,
            feedrateMin: this.config.get('feedrateMin', 500),
            feedrateMax: this.config.get('feedrateMax', 2000),
            spindleSpeedMin: this.config.get('spindleSpeedMin', 0),
            spindleSpeedMax: this.config.get('spindleSpeedMax', 1000),
            isFullscreen: false,
            connected: false,
            workflow: {
                state: controller.workflow.state
            },

            port: controller.port,
            units: METRIC_UNITS,

            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state
            },

            fileName: '',
            fileSize: 0,

            // G-code Status (from server)
            total: 0,
            sent: 0,
            received: 0,
            startTime: 0,
            finishTime: 0,
            elapsedTime: 0,
            remainingTime: 0,

            pausedTime: 0, //

            // Bounding box
            bbox: {
                min: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                max: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                delta: {
                    x: 0,
                    y: 0,
                    z: 0
                }
            }
        };
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('gcode:bbox', (msg, bbox) => {
                const dX = bbox.max.x - bbox.min.x;
                const dY = bbox.max.y - bbox.min.y;
                const dZ = bbox.max.z - bbox.min.z;

                this.setState({
                    bbox: {
                        min: {
                            x: bbox.min.x,
                            y: bbox.min.y,
                            z: bbox.min.z
                        },
                        max: {
                            x: bbox.max.x,
                            y: bbox.max.y,
                            z: bbox.max.z
                        },
                        delta: {
                            x: dX,
                            y: dY,
                            z: dZ
                        }
                    }
                });
            }),
            pubsub.subscribe('gcode:fileInfo', (msg, file) => {
                this.setState({
                    fileName: file.name,
                    fileSize: file.size,
                    total: file.total,
                    toolsAmount: file.toolSet.size,
                    toolsUsed: file.toolSet,
                });
            })
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
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

    isRunningJob() {
        const { workflow } = this.state;

        if (workflow.state !== WORKFLOW_STATE_IDLE) {
            return true;
        }

        return false;
    }

    jobIsPaused() {
        const { workflow } = this.state;

        if (workflow.state === WORKFLOW_STATE_PAUSED) {
            return true;
        }

        return false;
    }

    render() {
        const { units, bbox } = this.state;
        const state = {
            ...this.state,
            isRunningJob: this.isRunningJob(),
            jobIsPaused: this.jobIsPaused(),
            bbox: mapValues(bbox, (position) => {
                return mapValues(position, (pos, axis) => {
                    return mapPositionToUnits(pos, units);
                });
            })
        };
        const actions = {
            ...this.actions
        };

        return (
            <Widget
                className={classNames(styles['job-status-widget'])}
                // borderless
            >
                <Widget.Content className={classNames(styles['job-status-widget-content'])}>
                    <JobStatus
                        state={state}
                        actions={actions}
                    />
                </Widget.Content>
            </Widget>
        );
    }
}

export default JobStatusWidget;
