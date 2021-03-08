import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import pubsub from 'pubsub-js';
import controller from 'app/lib/controller';
import GeneralSettings from './GeneralSettings';
import Keybindings from './Keybindings';
import ProbeSettings from './Probe/ProbeSettings';
import WidgetConfig from '../../widgets/WidgetConfig';
import store from '../../store';
import styles from './index.styl';
import { METRIC_UNITS } from '../../constants';


class PreferencesPage extends PureComponent {
    probeConfig = new WidgetConfig('probe');

    state = this.getInitialState();

    getInitialState() {
        return {
            selectedMenu: 0,
            units: store.get('workspace.units', METRIC_UNITS),
            reverseWidgets: store.get('workspace.reverseWidgets', false),
            autoReconnect: store.get('widgets.connection.autoReconnect', false),
            baudrate: store.get('widgets.connection.baudrate', 115200),
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
                // {
                //     id: 1,
                //     label: 'Tools',
                //     component: ToolSettings
                // },
                {
                    id: 1,
                    label: 'Probe',
                    component: ProbeSettings
                },
                {
                    id: 2,
                    label: 'Keybindings',
                    component: Keybindings
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
        };
    }

    actions = {
        setSelectedMenu: (index) => {
            this.setState({
                selectedMenu: index
            });
        },
        general: {
            setUnits: (units) => {
                this.setState({
                    units: units
                });
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
            }
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
                this.setState({
                    probe: {
                        ...probe,
                        xyThickness: value
                    }
                });
            },
            changeZThickness: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };
                this.setState({
                    probe: {
                        ...probe,
                        zThickness: value
                    }
                });
            },
            changePlateWidth: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };
                this.setState({
                    probe: {
                        ...probe,
                        plateWidth: value
                    }
                });
            },
            changePlateLength: (e) => {
                const value = Number(e.target.value);
                const probe = { ...this.state.probe };
                this.setState({
                    probe: {
                        ...probe,
                        plateLength: value
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
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { tools, tool, probe, probeSettings, units, reverseWidgets, autoReconnect } = this.state;
        store.set('workspace.reverseWidgets', reverseWidgets);
        store.set('widgets.connection.autoReconnect', autoReconnect);
        store.set('workspace.units', units);
        store.replace('workspace[tools]', tools);
        store.set('workspace[tool]', tool);
        store.replace('workspace[probeProfile]', probe);
        this.probeConfig.set('retractionDistance', probeSettings.retractionDistance);
        this.probeConfig.set('probeFeedrate', probeSettings.normalFeedrate);
        this.probeConfig.set('probeFastFeedrate', probeSettings.fastFeedrate);
    }

    convertToMetric(diameter) {
        return (diameter * 25.4).toFixed(3);
    }

    convertToImperial(diameter) {
        return (diameter / 25.4).toFixed(3);
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
