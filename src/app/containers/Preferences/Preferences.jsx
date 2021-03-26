import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import pubsub from 'pubsub-js';
import _ from 'lodash';
import controller from 'app/lib/controller';
import { Toaster, TOASTER_SUCCESS } from '../../lib/toaster/ToasterLib';
import GeneralSettings from './GeneralSettings';
import Keybindings from './Keybindings';
import ProbeSettings from './Probe/ProbeSettings';
import WidgetConfig from '../../widgets/WidgetConfig';
import VisualizerSettings from './Visualizer/Visualizer';
import store from '../../store';
import styles from './index.styl';
import { METRIC_UNITS } from '../../constants';
import { convertToImperial, convertToMetric } from './calculate';

class PreferencesPage extends PureComponent {
    probeConfig = new WidgetConfig('probe');

    visualizerConfig = new WidgetConfig('visualizer');

    state = this.getInitialState();

    showToast = _.throttle(() => {
        Toaster.pop({
            msg: 'Settings Updated',
            type: TOASTER_SUCCESS,
            duration: 3000
        });
    }, 3000, { trailing: false });

    getInitialState() {
        return {
            selectedMenu: 0,
            units: store.get('workspace.units', METRIC_UNITS),
            reverseWidgets: store.get('workspace.reverseWidgets', false),
            autoReconnect: store.get('widgets.connection.autoReconnect', false),
            baudrate: store.get('widgets.connection.baudrate', 115200),
            safeRetractHeight: store.get('workspace.safeRetractHeight', 10),
            controller: {
                type: controller.type,
                settings: controller.settings,
                state: controller.state
            },
            menu: [
                {
                    id: 0,
                    label: 'General',
                    component: GeneralSettings
                },
                {
                    id: 1,
                    label: 'Probe',
                    component: ProbeSettings
                },
                {
                    id: 2,
                    label: 'Keybindings',
                    component: Keybindings
                },
                {
                    id: 3,
                    label: 'Visualizer',
                    component: VisualizerSettings
                }
            ],
            tools: store.get('workspace[tools]', []),
            tool: {
                metricDiameter: 0,
                imperialDiameter: 0,
                type: 'end mill'
            },
            probe: store.get('workspace[probeProfile]'),
            probeSettings: {
                retractionDistance: Number(this.probeConfig.get('retractionDistance') || 0).toFixed(3) * 1,
                normalFeedrate: Number(this.probeConfig.get('probeFeedrate') || 0).toFixed(3) * 1,
                fastFeedrate: Number(this.probeConfig.get('probeFastFeedrate') || 0).toFixed(3) * 1,
                probeCommand: this.probeConfig.get('probeCommand', 'G38.2'),
            },
            visualizer: {
                theme: this.visualizerConfig.get('theme'),
                objects: this.visualizerConfig.get('objects'),
                disabled: this.visualizerConfig.get('disabled'),
                disabledLite: this.visualizerConfig.get('disabledLite')
            },
            showWarning: store.get('widgets.visualizer.showWarning'),
            showLineWarnings: store.get('widgets.visualizer.showLineWarnings'),
        };
    }

    actions = {
        setSelectedMenu: (index) => {
            this.setState({
                selectedMenu: index
            });
        },
        general: {
            setSafeRetractHeight: (e) => {
                const value = Number(e.target.value);
                this.setState({
                    safeRetractHeight: value
                });
                pubsub.publish('safeHeight:update', value);
            },
            setUnits: (units) => {
                this.setState({
                    units: units
                }, this.convertUnits());
                pubsub.publish('units:change', units);
            },
            setReverseWidgets: () => {
                const reverseWidgetState = !this.state.reverseWidgets;
                this.setState({
                    reverseWidgets: reverseWidgetState
                });
                pubsub.publish('widgets:reverse', reverseWidgetState);
            },
            setAutoReconnect: () => {
                const autoReconnect = !this.state.autoReconnect;
                this.setState({
                    autoReconnect: autoReconnect
                });
                pubsub.publish('autoReconnect:update', autoReconnect);
            },
            setBaudrate: (option) => {
                this.setState({
                    baudrate: option.value
                });
                pubsub.publish('baudrate:update', option.value);
            },
            setShowWarning: (shouldShow) => {
                store.set('widgets.visualizer.showWarning', shouldShow);
                this.setState({ showWarning: shouldShow });
                pubsub.publish('gcode:showWarning', shouldShow);
            },
            setShowLineWarnings: (shouldShow) => {
                store.set('widgets.visualizer.showLineWarnings', shouldShow);
                this.setState({ showLineWarnings: shouldShow });
                pubsub.publish('gcode:showLineWarnings', shouldShow);
            },
        },
        tool: {
            setImperialDiameter: (e) => {
                const diameter = Number(e.target.value);
                const metricDiameter = this.convertToMetric(diameter);
                const tool = this.state.tool;
                this.setState({
                    tool: {
                        ...tool,
                        metricDiameter: metricDiameter,
                        imperialDiameter: diameter,
                    }
                });
            },
            setMetricDiameter: (e) => {
                const diameter = Number(e.target.value);
                const imperialDiameter = this.convertToImperial(diameter);
                const tool = this.state.tool;
                this.setState({
                    tool: {
                        ...tool,
                        metricDiameter: diameter,
                        imperialDiameter: imperialDiameter,
                    }
                });
            },
            setToolType: (e) => {
                const type = e.target.value;
                const tool = this.state.tool;
                this.setState({
                    tool: {
                        ...tool,
                        type: type
                    }
                });
            },
            addTool: () => {
                const tools = [...this.state.tools];
                const tool = this.state.tool;
                tools.push(tool);
                tools.sort(this.toolSortCompare);
                this.setState({
                    tools: tools
                });
                pubsub.publish('tools:updated');
            },
            deleteTool: (index) => {
                const tools = [...this.state.tools];
                tools.splice(index, 1);
                this.setState({
                    tools: [...tools]
                });
                pubsub.publish('tools:updated');
            }
        },
        probe: {
            handleToggleChange: (...keys) => {
                const probe = { ...this.state.probe };
                const functions = { ...probe.functions };

                keys.forEach((key) => {
                    functions[key] = !functions[key];
                });
                this.setState({
                    probe: {
                        ...probe,
                        functions: {
                            ...functions,
                        }
                    }
                });
                pubsub.publish('probe:updated');
            },
            changeRetractionDistance: (e) => {
                const probeSettings = { ...this.state.probeSettings };
                const value = Number(e.target.value).toFixed(3) * 1;
                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        retractionDistance: value
                    }
                });
            },
            changeNormalFeedrate: (e) => {
                const probeSettings = { ...this.state.probeSettings };
                const value = Number(e.target.value).toFixed(3) * 1;
                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        normalFeedrate: value
                    }
                });
            },
            changeXYThickness: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };

                const { units } = this.state;

                const metricValue = units === 'mm' ? value : convertToMetric(value);
                const imperialValue = units === 'in' ? value : convertToImperial(value);

                this.setState({
                    probe: {
                        ...probe,
                        xyThickness: {
                            mm: metricValue,
                            in: imperialValue
                        }
                    }
                });
            },
            changeZThickness: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };

                const { units } = this.state;

                const metricValue = units === 'mm' ? value : convertToMetric(value);
                const imperialValue = units === 'in' ? value : convertToImperial(value);

                this.setState({
                    probe: {
                        ...probe,
                        zThickness: {
                            mm: metricValue,
                            in: imperialValue
                        }
                    }
                });
            },
            changePlateWidth: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };

                const { units } = this.state;

                const metricValue = units === 'mm' ? value : convertToMetric(value);
                const imperialValue = units === 'in' ? value : convertToImperial(value);

                this.setState({
                    probe: {
                        ...probe,
                        plateWidth: {
                            mm: metricValue,
                            in: imperialValue
                        }
                    }
                });
            },
            changePlateLength: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };

                const { units } = this.state;

                const metricValue = units === 'mm' ? value : convertToMetric(value);
                const imperialValue = units === 'in' ? value : convertToImperial(value);

                this.setState({
                    probe: {
                        ...probe,
                        plateLength: {
                            mm: metricValue,
                            in: imperialValue
                        }
                    }
                });
            },
            changeFastFeedrate: (e) => {
                const probeSettings = { ...this.state.probeSettings };
                const value = Number(e.target.value).toFixed(3) * 1;
                this.setState({
                    probeSettings: {
                        ...probeSettings,
                        fastFeedrate: value
                    }
                });
            },
        },
        visualizer: {
            handleThemeChange: (theme) => {
                const { visualizer } = this.state;
                this.setState({
                    visualizer: {
                        ...visualizer,
                        theme: theme.value
                    }
                });
                pubsub.publish('theme:change', theme.value);
            },
            handleVisEnabledToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                if (liteMode) {
                    const value = visualizer.disabledLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            disabledLite: !value
                        }
                    });
                } else {
                    const value = visualizer.disabled;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            disabled: !value
                        }
                    });
                }
                pubsub.publish('visualizer:settings');
            },
            handleCutPathToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                const { objects } = visualizer;
                const { cutPath } = objects;
                if (liteMode) {
                    const value = cutPath.visibleLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cutPath: {
                                    ...cutPath,
                                    visibleLite: !value
                                }
                            }
                        }
                    });
                } else {
                    const value = cutPath.visible;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cutPath: {
                                    ...cutPath,
                                    visible: !value
                                }
                            }
                        }
                    });
                }
                pubsub.publish('visualizer:settings');
            },
            handleAnimationToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                const { objects } = visualizer;
                const { cuttingToolAnimation } = objects;
                if (liteMode) {
                    const value = cuttingToolAnimation.visibleLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingToolAnimation: {
                                    ...cuttingToolAnimation,
                                    visibleLite: !value
                                }
                            }
                        }
                    });
                } else {
                    const value = cuttingToolAnimation.visible;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingToolAnimation: {
                                    ...cuttingToolAnimation,
                                    visible: !value
                                }
                            }
                        }
                    });
                }
                pubsub.publish('visualizer:settings');
            },
            handleBitToggle: (liteMode = false) => {
                const { visualizer } = this.state;
                const { objects } = visualizer;
                const { cuttingTool } = objects;
                if (liteMode) {
                    const value = cuttingTool.visibleLite;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingTool: {
                                    ...cuttingTool,
                                    visibleLite: !value
                                }
                            }
                        }
                    });
                } else {
                    const value = cuttingTool.visible;
                    this.setState({
                        visualizer: {
                            ...visualizer,
                            objects: {
                                ...objects,
                                cuttingTool: {
                                    ...cuttingTool,
                                    visible: !value
                                }
                            }
                        }
                    });
                }
                pubsub.publish('visualizer:settings');
            }
        }
    }

    componentDidMount() {
        controller.command('settings:updated', this.state);
    }

    componentDidUpdate(prevProps, prevState) {
        const { tools, tool, probe, probeSettings, units, reverseWidgets, autoReconnect, visualizer, safeRetractHeight } = this.state;
        store.set('workspace.reverseWidgets', reverseWidgets);
        store.set('workspace.safeRetractHeight', safeRetractHeight);
        store.set('widgets.connection.autoReconnect', autoReconnect);
        store.set('widgets.visualizer.theme', visualizer.theme);
        store.set('widgets.visualizer.disabled', visualizer.disabled);
        store.set('widgets.visualizer.disabledLite', visualizer.disabledLite);
        store.set('workspace.units', units);
        store.replace('workspace[tools]', tools);
        store.replace('widgets.visualizer.objects', visualizer.objects);
        store.set('workspace[tool]', tool);
        store.replace('workspace[probeProfile]', probe);
        this.probeConfig.set('retractionDistance', probeSettings.retractionDistance);
        this.probeConfig.set('probeFeedrate', probeSettings.normalFeedrate);
        this.probeConfig.set('probeFastFeedrate', probeSettings.fastFeedrate);

        controller.command('settings:updated', this.state);

        if (prevState.selectedMenu !== this.state.selectedMenu) {
            return;
        }

        this.showToast();
    }

    toolSortCompare(a, b) {
        if (a.metricDiameter < b.metricDiameter) {
            return -1;
        }
        if (a.metricDiameter > b.metricDiameter) {
            return 1;
        }
        return 0;
    }

    convertUnits() {
        let { units, safeRetractHeight } = this.state;
        if (units === METRIC_UNITS) {
            safeRetractHeight = convertToImperial(safeRetractHeight);
        } else {
            safeRetractHeight = convertToMetric(safeRetractHeight);
        }
        this.setState({
            safeRetractHeight: safeRetractHeight
        });
        pubsub.publish('safeHeight:update', safeRetractHeight);
    }

    convertToMetric(diameter) {
        return (diameter * 25.4).toFixed(2);
    }

    convertToImperial(diameter) {
        return (diameter / 25.4).toFixed(4);
    }

    render() {
        const { modalClose } = this.props;
        const state = { ...this.state };
        const actions = { ...this.actions };
        const { menu, selectedMenu } = state;

        return (
            <Modal onClose={ modalClose }>
                <div className={ styles.preferencesContainer }>
                    <div className={ styles.preferencesContent }>
                        <div className={ styles.preferencesMenu }>
                            <h3>Settings</h3>
                            {
                                menu.map((menuItem, index) => (
                                    <button
                                        type="button"
                                        key={`section-${menuItem.label}`}
                                        className={index === selectedMenu ? 'activeMenu' : ''}
                                        onClick={() => actions.setSelectedMenu(index)}
                                    >
                                        { menuItem.label }
                                    </button>
                                ))
                            }
                        </div>
                        <div className={styles.preferencesOptions}>
                            {
                                menu.map((menuItem, index) => (
                                    <div key={menuItem.id}>
                                        { <menuItem.component
                                            actions={actions}
                                            state={state}
                                            active={index === selectedMenu}
                                        /> }
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default PreferencesPage;
