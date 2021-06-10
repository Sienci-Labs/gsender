import includes from 'lodash/includes';

import get from 'lodash/get';
import pubsub from 'pubsub-js';
import PropTypes from 'prop-types';
// import classnames from 'classnames';
import store from 'app/store';
import React, { PureComponent } from 'react';
import Anchor from 'app/components/Anchor';
import { Button } from 'app/components/Buttons';
import ModalTemplate from 'app/components/ModalTemplate';
import TabbedWidget from 'app/components/TabbedWidget';
import Modal from 'app/components/Modal';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import portal from 'app/lib/portal';
import * as WebGL from 'app/lib/three/WebGL';
import { Toaster } from 'app/lib/toaster/ToasterLib';
import Visualizer from './Visualizer';
import Loading from './Loading';
import Rendering from './Rendering';
import GcodeViewer from '../GcodeViewer';
import WidgetConfig from '../../../../widgets/WidgetConfig';
import {
    // Units
    // IMPERIAL_UNITS,
    METRIC_UNITS,
    // Grbl
    GRBL,
    GRBL_ACTIVE_STATE_RUN,
    // Workflow
    WORKFLOW_STATE_RUNNING,
} from '../../../../constants';
import {
    CAMERA_MODE_PAN,
    CAMERA_MODE_ROTATE,
    LIGHT_THEME,
    LIGHT_THEME_VALUES,
    DARK_THEME,
    DARK_THEME_VALUES
} from './constants';
// import styles from './index.styl';

const displayWebGLErrorMessage = () => {
    portal(({ onClose }) => (
        <Modal disableOverlay size="xs" onClose={onClose}>
            <Modal.Header>
                <Modal.Title>
                    WebGL Error Message
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ModalTemplate type="warning">
                    {window.WebGLRenderingContext && (
                        <div>
                        Your graphics card does not seem to support <Anchor href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</Anchor>.
                            <br />
                        Find out how to get it <Anchor href="http://get.webgl.org/">here</Anchor>.
                        </div>
                    )}
                    {!window.WebGLRenderingContext && (
                        <div>
                        Your browser does not seem to support <Anchor href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</Anchor>.
                            <br />
                        Find out how to get it <Anchor href="http://get.webgl.org/">here</Anchor>.
                        </div>
                    )}
                </ModalTemplate>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    onClick={onClose}
                >
                    {i18n._('OK')}
                </Button>
            </Modal.Footer>
        </Modal>
    ));
};

class SurfacingVisualizer extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        gcode: PropTypes.string,
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
        dismissNotification: () => {
            this.setState((state) => ({
                notification: {
                    ...state.notification,
                    type: '',
                    data: ''
                }
            }));
        },
        openModal: (name = '', params = {}) => {
            this.setState((state) => ({
                modal: {
                    name: name,
                    params: params
                }
            }));
        },
        closeModal: () => {
            this.setState((state) => ({
                modal: {
                    name: '',
                    params: {}
                }
            }));
        },
        updateModalParams: (params = {}) => {
            this.setState((state) => ({
                modal: {
                    ...state.modal,
                    params: {
                        ...state.modal.params,
                        ...params
                    }
                }
            }));
        },
        uploadFile: (gcode, meta) => {
            const { name, size } = { ...meta };

            console.log(this);

            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: true,
                    rendering: false,
                    ready: false
                }
            }));

            this.actions.loadGCode(name, gcode, size);
        },
        loadGCode: (name, gcode, size) => {
            const { filename } = this.state;

            if (filename) {
                this.actions.unloadGCode();
            }

            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: true,
                    rendering: false,
                    ready: false
                }
            }));

            const capable = {
                view3D: !!this.visualizer
            };

            const updater = (state) => {
                return ({
                    gcode: {
                        ...state.gcode,
                        loading: false,
                        rendering: capable.view3D,
                        ready: !capable.view3D,
                        content: gcode,
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
                            }
                        },
                        name: name,
                    }
                });
            };
            const callback = () => {
                // Clear gcode bounding box
                controller.context = {
                    ...controller.context,
                    xmin: 0,
                    xmax: 0,
                    ymin: 0,
                    ymax: 0,
                    zmin: 0,
                    zmax: 0
                };

                if (!capable.view3D) {
                    return;
                }

                setTimeout(() => {
                    this.visualizer.load(name, gcode, ({ bbox }) => {
                        // Set gcode bounding box
                        controller.context = {
                            ...controller.context,
                            xmin: bbox.min.x,
                            xmax: bbox.max.x,
                            ymin: bbox.min.y,
                            ymax: bbox.max.y,
                            zmin: bbox.min.z,
                            zmax: bbox.max.z
                        };

                        const { port } = this.state;

                        this.setState((state) => ({
                            gcode: {
                                ...state.gcode,
                                loading: false,
                                rendering: false,
                                ready: true,
                                bbox: bbox,
                                loadedBeforeConnection: !port,
                            },
                            filename: name,
                        }));
                    });
                }, 0);
            };

            this.setState(updater, callback);
            this.visualizer.handleSceneRender(gcode);
        },
        unloadGCode: () => {
            const visualizer = this.visualizer;
            if (visualizer) {
                visualizer.unload();
            }

            // Clear gcode bounding box
            controller.context = {
                ...controller.context,
                xmin: 0,
                xmax: 0,
                ymin: 0,
                ymax: 0,
                zmin: 0,
                zmax: 0
            };

            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: false,
                    rendering: false,
                    ready: false,
                    content: '',
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
                        }
                    }
                }
            }));
        },
        setBoundingBox: (bbox) => {
            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    bbox: bbox
                }
            }));
        },
        toggle3DView: () => {
            if (!WebGL.isWebGLAvailable() && this.state.disabled) {
                displayWebGLErrorMessage();
                return;
            }

            this.setState((state) => ({
                disabled: !state.disabled
            }));
        },
        toPerspectiveProjection: (projection) => {
            this.setState((state) => ({
                projection: 'perspective'
            }));
        },
        toOrthographicProjection: (projection) => {
            this.setState((state) => ({
                projection: 'orthographic'
            }));
        },
        toggleGCodeFilename: () => {
            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    displayName: !state.gcode.displayName
                }
            }));
        },
        toggleLimitsVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    limits: {
                        ...state.objects.limits,
                        visible: !state.objects.limits.visible
                    }
                }
            }));
        },
        toggleCoordinateSystemVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    coordinateSystem: {
                        ...state.objects.coordinateSystem,
                        visible: !state.objects.coordinateSystem.visible
                    }
                }
            }));
        },
        toggleGridLineNumbersVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    gridLineNumbers: {
                        ...state.objects.gridLineNumbers,
                        visible: !state.objects.gridLineNumbers.visible
                    }
                }
            }));
        },
        toggleCuttingToolVisibility: () => {
            this.setState((state) => ({
                objects: {
                    ...state.objects,
                    cuttingTool: {
                        ...state.objects.cuttingTool,
                        visible: !state.objects.cuttingTool.visible
                    }
                }
            }));
        },
        camera: {
            toRotateMode: () => {
                this.setState((state) => ({
                    cameraMode: CAMERA_MODE_ROTATE
                }));
            },
            toPanMode: () => {
                this.setState((state) => ({
                    cameraMode: CAMERA_MODE_PAN
                }));
            },
            zoomFit: () => {
                if (this.visualizer) {
                    this.visualizer.zoomFit();
                }
            },
            zoomIn: () => {
                if (this.visualizer) {
                    this.visualizer.zoomIn();
                }
            },
            zoomOut: () => {
                if (this.visualizer) {
                    this.visualizer.zoomOut();
                }
            },
            panUp: () => {
                if (this.visualizer) {
                    this.visualizer.panUp();
                }
            },
            panDown: () => {
                if (this.visualizer) {
                    this.visualizer.panDown();
                }
            },
            panLeft: () => {
                if (this.visualizer) {
                    this.visualizer.panLeft();
                }
            },
            panRight: () => {
                if (this.visualizer) {
                    this.visualizer.panRight();
                }
            },
            lookAtCenter: () => {
                if (this.visualizer) {
                    this.visualizer.lookAtCenter();
                }
            },
            toTopView: () => {
                this.setState({ cameraPosition: 'top' });
            },
            to3DView: () => {
                this.setState({ cameraPosition: '3d' });
            },
            toFrontView: () => {
                this.setState({ cameraPosition: 'front' });
            },
            toLeftSideView: () => {
                this.setState({ cameraPosition: 'left' });
            },
            toRightSideView: () => {
                this.setState({ cameraPosition: 'right' });
            }
        },
        handleLiteModeToggle: () => {
            const { liteMode, disabled, disabledLite } = this.state;
            const newLiteModeValue = !liteMode;
            const shouldRenderVisualization = newLiteModeValue ? !disabledLite : !disabled;
            this.renderIfNecessary(shouldRenderVisualization);

            this.setState({
                liteMode: newLiteModeValue
            });
        },
        setVisualizerReady: () => {
            this.setState((state) => ({
                gcode: {
                    ...state.gcode,
                    loading: false,
                    rendering: false,
                    ready: true,
                }
            }));
        },
        reset: () => {
            if (!this.state.filename) {
                return;
            }

            this.setState(this.getInitialState());
            this.actions.unloadGCode();
            Toaster.pop({
                msg: 'Surfacing G-code Cleared',
                icon: 'fa-exclamation'
            });
        }
    };

    pubsubTokens = [];

    unsubscribe() {
        this.pubsubTokens.forEach((token) => {
            pubsub.unsubscribe(token);
        });
        this.pubsubTokens = [];
    }

    visualizer = null;

    componentDidMount() {
        this.subscribe();

        if (!WebGL.isWebGLAvailable() && !this.state.disabled) {
            displayWebGLErrorMessage();

            setTimeout(() => {
                this.setState((state) => ({
                    disabled: true
                }));
            }, 0);
        }
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.disabled !== prevState.disabled) {
            this.config.set('disabled', this.state.disabled);
        }
        if (this.state.projection !== prevState.projection) {
            this.config.set('projection', this.state.projection);
        }
        if (this.state.cameraMode !== prevState.cameraMode) {
            this.config.set('cameraMode', this.state.cameraMode);
        }
        if (this.state.gcode.displayName !== prevState.gcode.displayName) {
            this.config.set('gcode.displayName', this.state.gcode.displayName);
        }
        if (this.state.objects.limits.visible !== prevState.objects.limits.visible) {
            this.config.set('objects.limits.visible', this.state.objects.limits.visible);
        }
        if (this.state.objects.coordinateSystem.visible !== prevState.objects.coordinateSystem.visible) {
            this.config.set('objects.coordinateSystem.visible', this.state.objects.coordinateSystem.visible);
        }
        if (this.state.objects.gridLineNumbers.visible !== prevState.objects.gridLineNumbers.visible) {
            this.config.set('objects.gridLineNumbers.visible', this.state.objects.gridLineNumbers.visible);
        }
        if (this.state.objects.cuttingTool.visible !== prevState.objects.cuttingTool.visible) {
            this.config.set('objects.cuttingTool.visible', this.state.objects.cuttingTool.visible);
        }
    }

    getInitialState() {
        return {
            units: store.get('workspace.units', METRIC_UNITS),
            theme: this.config.get('theme'),
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state
            },
            notification: {
                type: '',
                data: ''
            },
            modal: {
                name: '',
                params: {}
            },
            gcode: {
                displayName: this.config.get('gcode.displayName', true),
                loading: false,
                rendering: false,
                ready: false,
                content: '',
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
                    }
                },
                // Updates by the "sender:status" event
                name: '',
                size: 0,
                total: 0,
                sent: 0,
                received: 0,
                loadedBeforeConnection: false,
            },
            disabled: this.config.get('disabled', false),
            disabledLite: this.config.get('disabledLite'),
            liteMode: this.config.get('liteMode'),
            projection: this.config.get('projection', 'orthographic'),
            objects: {
                limits: {
                    visible: this.config.get('objects.limits.visible', true)
                },
                coordinateSystem: {
                    visible: this.config.get('objects.coordinateSystem.visible', true)
                },
                gridLineNumbers: {
                    visible: this.config.get('objects.gridLineNumbers.visible', true)
                },
                cuttingTool: {
                    visible: this.config.get('objects.cuttingTool.visible', true),
                    visibleLite: this.config.get('objects.cuttingTool.visibleLite', true)
                },
                cuttingToolAnimation: {
                    visible: this.config.get('objects.cuttingToolAnimation.visible', true),
                    visibleLite: this.config.get('objects.cuttingToolAnimation.visibleLite', true)
                },
                cutPath: {
                    visible: this.config.get('objects.cutPath.visible', true),
                    visibleLite: this.config.get('objects.cutPath.visibleLite', true)
                }
            },
            cameraMode: this.config.get('cameraMode', CAMERA_MODE_PAN),
            cameraPosition: 'top', // 'top', '3d', 'front', 'left', 'right'
            isAgitated: false, // Defaults to false
            currentTheme: this.getVisualizerTheme(),
            currentTab: 0,
            filename: '',
            fileSize: 0, //in bytes
            total: 0,
        };
    }

    getVisualizerTheme() {
        const { theme } = store.get('widgets.visualizer');
        if (theme === LIGHT_THEME) {
            return LIGHT_THEME_VALUES;
        }
        if (theme === DARK_THEME) {
            return DARK_THEME_VALUES;
        }
        return DARK_THEME_VALUES;
    }

    isAgitated() {
        const { workflow, disabled, objects } = this.state;
        const controllerType = this.state.controller.type;
        const controllerState = this.state.controller.state;

        if (workflow?.state !== WORKFLOW_STATE_RUNNING) {
            return false;
        }
        // Return false when 3D view is disabled
        if (disabled) {
            return false;
        }
        // Return false when the cutting tool is not visible
        if (!objects.cuttingTool.visible) {
            return false;
        }
        if (!includes([GRBL], controllerType)) {
            return false;
        }
        if (controllerType === GRBL) {
            const activeState = get(controllerState, 'status.activeState');
            if (activeState !== GRBL_ACTIVE_STATE_RUN) {
                return false;
            }
        }

        return true;
    }

    setCurrentTab = (id = 0) => this.setState({ currentTab: id });

    subscribe() {
        const tokens = [
            pubsub.subscribe('theme:change', (msg, theme) => {
                this.setState({
                    theme: theme
                }, this.setState({
                    currentTheme: this.getVisualizerTheme()
                }), pubsub.publish('visualizer:redraw'));
            }),
            pubsub.subscribe('visualizer:settings', () => {
                this.setState({
                    disabled: this.config.get('disabled'),
                    disabledLite: this.config.get('disabledLite'),
                    objects: this.config.get('objects')
                });
            }),
            pubsub.subscribe('units:change', (msg, units) => {
                this.setState({
                    units: units
                });
            }),
            pubsub.subscribe('gcode:bbox', (msg, bbox) => {
                const { gcode } = this.state;
                this.setState({
                    gcode: {
                        ...gcode,
                        bbox: bbox
                    }
                });
            })
        ];
        this.pubsubTokens = this.pubsubTokens.concat(tokens);
    }

    renderIfNecessary(shouldRender) {
        const hasVisualization = this.visualizer.hasVisualization();
        if (shouldRender && !hasVisualization) {
            this.visualizer.rerenderGCode();
        }
    }

    render() {
        const state = {
            ...this.state,
            isAgitated: this.isAgitated()
        };
        const actions = {
            ...this.actions
        };
        const showLoader = state.gcode.loading || state.gcode.rendering;

        // Handle visualizer render
        const isVisualizerDisabled = (state.liteMode) ? state.disabledLite : state.disabled;

        const capable = {
            view3D: WebGL.isWebGLAvailable() && !isVisualizerDisabled
        };
        const showVisualizer = capable.view3D && !showLoader;
        const { currentTab } = state;
        const { gcode } = this.props;

        const tabs = [
            {
                id: 0,
                label: 'Visualizer Preview',
                widgetId: 'viz-preview',
                component: <Visualizer
                    show={showVisualizer}
                    cameraPosition={state.cameraPosition}
                    ref={node => {
                        this.visualizer = node;
                    }}
                    state={state}
                    actions={actions}
                    gcode={gcode}
                />
            },
            {
                id: 1,
                label: `G-code Viewer ${gcode && `(${gcode.split('\n').length} lines)`}`,
                widgetId: 'gcode-viewer',
                component: <GcodeViewer gcode={gcode} />,
                disabled: !gcode,
            }
        ];
        return (
            <div id="surface_visualizer_container" style={{ height: '100%' }}>
                {state.gcode.loading &&
                <Loading />
                }
                {state.gcode.rendering &&
                <Rendering />
                }

                <TabbedWidget>
                    <TabbedWidget.Tabs
                        tabs={tabs}
                        activeTabIndex={currentTab}
                        onClick={(index) => this.setCurrentTab(index)}
                        style={{ backgroundColor: '#e5e7eb' }}
                    >
                    </TabbedWidget.Tabs>
                    <TabbedWidget.Content>
                        {
                            tabs.map((tab, index) => {
                                const active = index === currentTab;
                                return (
                                    <TabbedWidget.ChildComponent key={tab.id} active={active}>
                                        {tab.component}
                                    </TabbedWidget.ChildComponent>
                                );
                            })
                        }
                    </TabbedWidget.Content>
                </TabbedWidget>
            </div>
        );
    }
}

export default SurfacingVisualizer;
