import _ from 'lodash';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';
import pubsub from 'pubsub-js';
import Header from 'app/containers/Header';
import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import api from 'app/api';
import {
    WORKFLOW_STATE_IDLE
} from 'app/constants';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import log from 'app/lib/log';
import store from 'app/store';
import * as widgetManager from './WidgetManager';
import DefaultWidgets from './DefaultWidgets';
import PrimaryWidgets from './PrimaryWidgets';

import FeederPaused from './modals/FeederPaused';
import FeederWait from './modals/FeederWait';
import ServerDisconnected from './modals/ServerDisconnected';
import styles from './index.styl';
import {
    MODAL_NONE,
    MODAL_FEEDER_PAUSED,
    MODAL_FEEDER_WAIT,
    MODAL_SERVER_DISCONNECTED
} from './constants';

const WAIT = '%wait';

const startWaiting = () => {
    // Adds the 'wait' class to <html>
    const root = document.documentElement;
    root.classList.add('wait');
};
const stopWaiting = () => {
    // Adds the 'wait' class to <html>
    const root = document.documentElement;
    root.classList.remove('wait');
};

class Workspace extends PureComponent {
    static propTypes = {
        ...withRouter.propTypes
    };

    state = {
        disabled: true,
        mounted: false,
        port: '',
        modal: {
            name: MODAL_NONE,
            params: {}
        },
        isDraggingFile: false,
        isDraggingWidget: false,
        isUploading: false,
        showPrimaryContainer: store.get('workspace.container.primary.show'),
        inactiveCount: _.size(widgetManager.getInactiveWidgets()),
        reverseWidgets: store.get('workspace.reverseWidgets')
    };

    pubsubTokens = [];

    action = {
        openModal: (name = MODAL_NONE, params = {}) => {
            this.setState(state => ({
                modal: {
                    name: name,
                    params: params
                }
            }));
        },
        closeModal: () => {
            this.setState(state => ({
                modal: {
                    name: MODAL_NONE,
                    params: {}
                }
            }));
        },
        updateModalParams: (params = {}) => {
            this.setState(state => ({
                modal: {
                    ...state.modal,
                    params: {
                        ...state.modal.params,
                        ...params
                    }
                }
            }));
        }
    };

    sortableGroup = {
        primary: null,
        secondary: null
    };

    primaryContainer = null;

    secondaryContainer = null;

    primaryToggler = null;

    secondaryToggler = null;

    primaryWidgets = null;

    secondaryWidgets = null;

    defaultContainer = null;

    controllerEvents = {
        'connect': () => {
            this.setState({ disabled: false });
            if (controller.connected) {
                this.action.closeModal();
            } else {
                this.action.openModal(MODAL_SERVER_DISCONNECTED);
            }
        },
        'connect_error': () => {
            if (controller.connected) {
                this.action.closeModal();
            } else {
                this.action.openModal(MODAL_SERVER_DISCONNECTED);
            }
        },
        'disconnect': () => {
            this.setState({ disabled: true });
            if (controller.connected) {
                this.action.closeModal();
            } else {
                this.action.openModal(MODAL_SERVER_DISCONNECTED);
            }
        },
        'serialport:open': (options) => {
            this.setState({ disabled: false });
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            this.setState({ disabled: true });
            this.setState({ port: '' });
        },
        'feeder:status': (status) => {
            const { modal } = this.state;
            const { hold, holdReason } = { ...status };

            if (!hold) {
                if (_.includes([MODAL_FEEDER_PAUSED, MODAL_FEEDER_WAIT], modal.name)) {
                    this.action.closeModal();
                }
                return;
            }

            const { err, data } = { ...holdReason };

            if (err) {
                this.action.openModal(MODAL_FEEDER_PAUSED, {
                    title: i18n._('Error')
                });
                return;
            }

            if (data === WAIT) {
                this.action.openModal(MODAL_FEEDER_WAIT, {
                    title: '%wait'
                });
                return;
            }

            const title = {
                'M0': i18n._('M0 Program Pause'),
                'M1': i18n._('M1 Program Pause'),
                'M2': i18n._('M2 Program End'),
                'M30': i18n._('M30 Program End'),
                'M6': i18n._('M6 Tool Change'),
                'M109': i18n._('M109 Set Extruder Temperature'),
                'M190': i18n._('M190 Set Heated Bed Temperature')
            }[data] || data;

            this.action.openModal(MODAL_FEEDER_PAUSED, {
                title: title
            });
        }
    };

    widgetEventHandler = {
        onForkWidget: (widgetId) => {
            // TODO
        },
        onRemoveWidget: (widgetId) => {
            const inactiveWidgets = widgetManager.getInactiveWidgets();
            this.setState({ inactiveCount: inactiveWidgets.length });
        },
        onDragStart: () => {
            const { isDraggingWidget } = this.state;
            if (!isDraggingWidget) {
                this.setState({ isDraggingWidget: true });
            }
        },
        onDragEnd: () => {
            const { isDraggingWidget } = this.state;
            if (isDraggingWidget) {
                this.setState({ isDraggingWidget: false });
            }
        }
    };

    togglePrimaryContainer = () => {
        const { showPrimaryContainer } = this.state;
        this.setState({ showPrimaryContainer: !showPrimaryContainer });

        // Publish a 'resize' event
        pubsub.publish('resize'); // Also see "widgets/Visualizer"
    };

    resizeDefaultContainer = () => {
        // const sidebar = document.querySelector('#sidebar');
        // const secondaryToggler = ReactDOM.findDOMNode(this.secondaryToggler);
        const { showPrimaryContainer } = this.state;

        // Calculate VH based on current window height
        let vh = window.innerHeight * 0.01;
        let vw = window.innerWidth * 0.01;
        //Update styling with new VH value for CSS calculations
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        document.documentElement.style.setProperty('--vw', `${vw}px`);

        { // Mobile-Friendly View
            const { location } = this.props;
            const disableHorizontalScroll = !(showPrimaryContainer);

            if (location.pathname === '/workspace' && disableHorizontalScroll) {
                // Disable horizontal scroll
                document.body.scrollLeft = 0;
                document.body.style.overflowX = 'hidden';
            } else {
                // Enable horizontal scroll
                document.body.style.overflowX = '';
            }
        }

        // defaultContainer.style.right = secondaryToggler.offsetWidth + 'px';
        // Publish a 'resize' event
        pubsub.publish('resize'); // Also see "widgets/Visualizer"
    };

    onDrop = (files) => {
        const { port } = this.state;

        if (!port) {
            return;
        }

        let file = files[0];
        let reader = new FileReader();

        reader.onloadend = (event) => {
            const { result, error } = event.target;

            if (error) {
                log.error(error);
                return;
            }

            log.debug('FileReader:', _.pick(file, [
                'lastModified',
                'lastModifiedDate',
                'meta',
                'name',
                'size',
                'type'
            ]));

            startWaiting();
            this.setState({ isUploading: true });

            const name = file.name;
            const gcode = result;

            api.loadGCode({ port, name, gcode })
                .then((res) => {
                    const { name = '', gcode = '' } = { ...res.body };
                    pubsub.publish('gcode:load', { name, gcode });
                })
                .catch((res) => {
                    log.error('Failed to upload G-code file');
                })
                .then(() => {
                    stopWaiting();
                    this.setState({ isUploading: false });
                });
        };

        try {
            reader.readAsText(file);
        } catch (err) {
            // Ignore error
        }
    };

    updateWidgetsForPrimaryContainer = () => {
        widgetManager.show((activeWidgets, inactiveWidgets) => {
            const widgets = Object.keys(store.get('widgets', {}))
                .filter(widgetId => {
                    // e.g. "webcam" or "webcam:d8e6352f-80a9-475f-a4f5-3e9197a48a23"
                    const name = widgetId.split(':')[0];
                    return _.includes(activeWidgets, name);
                });

            const defaultWidgets = store.get('workspace.container.default.widgets');
            const sortableWidgets = _.difference(widgets, defaultWidgets);
            let primaryWidgets = store.get('workspace.container.primary.widgets');
            let secondaryWidgets = store.get('workspace.container.secondary.widgets');

            primaryWidgets = sortableWidgets.slice();
            _.pullAll(primaryWidgets, secondaryWidgets);
            pubsub.publish('updatePrimaryWidgets', primaryWidgets);

            secondaryWidgets = sortableWidgets.slice();
            _.pullAll(secondaryWidgets, primaryWidgets);
            pubsub.publish('updateSecondaryWidgets', secondaryWidgets);

            // Update inactive count
            this.setState({ inactiveCount: _.size(inactiveWidgets) });
        });
    };

    updateWidgetsForSecondaryContainer = () => {
        widgetManager.show((activeWidgets, inactiveWidgets) => {
            const widgets = Object.keys(store.get('widgets', {}))
                .filter(widgetId => {
                    // e.g. "webcam" or "webcam:d8e6352f-80a9-475f-a4f5-3e9197a48a23"
                    const name = widgetId.split(':')[0];
                    return _.includes(activeWidgets, name);
                });

            const defaultWidgets = store.get('workspace.container.default.widgets');
            const sortableWidgets = _.difference(widgets, defaultWidgets);
            let primaryWidgets = store.get('workspace.container.primary.widgets');
            let secondaryWidgets = store.get('workspace.container.secondary.widgets');

            secondaryWidgets = sortableWidgets.slice();
            _.pullAll(secondaryWidgets, primaryWidgets);
            pubsub.publish('updateSecondaryWidgets', secondaryWidgets);

            primaryWidgets = sortableWidgets.slice();
            _.pullAll(primaryWidgets, secondaryWidgets);
            pubsub.publish('updatePrimaryWidgets', primaryWidgets);

            // Update inactive count
            this.setState({ inactiveCount: _.size(inactiveWidgets) });
        });
    };

    componentDidMount() {
        this.addControllerEvents();
        this.addResizeEventListener();
        this.subscribe();

        setTimeout(() => {
            // A workaround solution to trigger componentDidUpdate on initial render
            this.setState({ mounted: true });
        }, 0);
    }

    componentWillUnmount() {
        this.unsubscribe();
        this.removeControllerEvents();
        this.removeResizeEventListener();
    }

    componentDidUpdate() {
        store.set('workspace.container.primary.show', this.state.showPrimaryContainer);

        this.resizeDefaultContainer();
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

    addResizeEventListener() {
        this.onResizeThrottled = _.throttle(this.resizeDefaultContainer, 25);
        window.addEventListener('resize', this.onResizeThrottled);
    }

    removeResizeEventListener() {
        window.removeEventListener('resize', this.onResizeThrottled);
        this.onResizeThrottled = null;
    }

    subscribe() {
        const tokens = [
            pubsub.subscribe('widgets:reverse', (msg, value) => {
                this.setState({
                    reverseWidgets: value
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


    render() {
        const { style, className } = this.props;
        let disabled = this.state.disabled;
        const {
            port,
            modal,
            isDraggingFile,
            isDraggingWidget,
            showPrimaryContainer,
            reverseWidgets
        } = this.state;
        const hidePrimaryContainer = !showPrimaryContainer;
        return (
            <div style={style} className={classNames(className, styles.workspace)}>
                {modal.name === MODAL_FEEDER_PAUSED && (
                    <FeederPaused
                        title={modal.params.title}
                        onClose={this.action.closeModal}
                    />
                )}
                {modal.name === MODAL_FEEDER_WAIT && (
                    <FeederWait
                        title={modal.params.title}
                        onClose={this.action.closeModal}
                    />
                )}
                {modal.name === MODAL_SERVER_DISCONNECTED &&
                    <ServerDisconnected />
                }
                <div
                    className={classNames(
                        styles.dropzoneOverlay,
                        { [styles.hidden]: !(port && isDraggingFile) }
                    )}
                >
                    <div className={styles.textBlock}>
                        {i18n._('Drop G-code file here')}
                    </div>
                </div>
                <Dropzone
                    className={styles.dropzone}
                    disabled={controller.workflow.state !== WORKFLOW_STATE_IDLE}
                    disableClick={true}
                    disablePreview={true}
                    multiple={false}
                    onDragStart={(event) => {
                    }}
                    onDragEnter={(event) => {
                        if (controller.workflow.state !== WORKFLOW_STATE_IDLE) {
                            return;
                        }
                        if (isDraggingWidget) {
                            return;
                        }
                        if (!isDraggingFile) {
                            this.setState({ isDraggingFile: true });
                        }
                    }}
                    onDragLeave={(event) => {
                        if (controller.workflow.state !== WORKFLOW_STATE_IDLE) {
                            return;
                        }
                        if (isDraggingWidget) {
                            return;
                        }
                        if (isDraggingFile) {
                            this.setState({ isDraggingFile: false });
                        }
                    }}
                    onDrop={(acceptedFiles, rejectedFiles) => {
                        if (controller.workflow.state !== WORKFLOW_STATE_IDLE) {
                            return;
                        }
                        if (isDraggingWidget) {
                            return;
                        }
                        if (isDraggingFile) {
                            this.setState({ isDraggingFile: false });
                        }
                        this.onDrop(acceptedFiles);
                    }}
                >
                    <div className={classNames(styles.workspaceTable)}>
                        <Header />
                        <div className={classNames(styles.workspaceTableRow, { [styles.reverseWorkspace]: reverseWidgets })}>
                            <DefaultWidgets
                                ref={node => {
                                    this.defaultContainer = node;
                                }}
                            />
                            <div
                                ref={node => {
                                    this.primaryContainer = node;
                                }}
                                className={classNames(
                                    styles.primaryContainer,
                                    { [styles.hidden]: hidePrimaryContainer },
                                    { [styles.disabled]: disabled }
                                )}
                            >
                                <PrimaryWidgets
                                    ref={node => {
                                        this.primaryWidgets = node;
                                    }}
                                    onForkWidget={this.widgetEventHandler.onForkWidget}
                                    onRemoveWidget={this.widgetEventHandler.onRemoveWidget}
                                    onDragStart={this.widgetEventHandler.onDragStart}
                                    onDragEnd={this.widgetEventHandler.onDragEnd}
                                />
                            </div>
                        </div>

                    </div>
                </Dropzone>
            </div>
        );
    }
}

export default withRouter(Workspace);
