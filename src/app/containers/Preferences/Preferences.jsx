import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import pubsub from 'pubsub-js';
import controller from 'app/lib/controller';
import GeneralSettings from './GeneralSettings';
import ToolSettings from './Tools/Tools';
import MachineProfiles from './MachineProfiles';
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
                    label: 'Tools',
                    component: ToolSettings
                },
                {
                    id: 2,
                    label: 'Machine Profiles',
                    component: MachineProfiles
                },
                {
                    id: 3,
                    label: 'Probe',
                    component: ProbeSettings
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
            },
            deleteTool: (index) => {
                const tools = [...this.state.tools];
                tools.splice(index, 1);
                this.setState({
                    tools: [...tools]
                });
            }
        },
        probe: {
            handleToggleChange: (key) => {
                const probe = { ...this.state.probe };
                const functions = { ...probe.functions };
                functions[key] = !functions[key];
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
        const { tools, tool, probe, probeSettings, units } = this.state;
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
