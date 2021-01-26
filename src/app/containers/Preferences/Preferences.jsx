import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import GeneralSettings from './GeneralSettings';
import ToolSettings from './Tools/Tools';
import MachineProfiles from './MachineProfiles';
import ProbeSettings from './Probe/ProbeSettings';
import WidgetConfig from '../../widgets/WidgetConfig';
import store from '../../store';
import styles from './index.styl';


class PreferencesPage extends PureComponent {
    probeConfig = new WidgetConfig('probe');
    state = this.getInitialState();


    getInitialState() {
        return {
            selectedMenu: 0,
            menu: [
                {
                    label: 'General',
                    component: GeneralSettings
                },
                {
                    label: 'Tools',
                    component: ToolSettings
                },
                {
                    label: 'Machine Profiles',
                    component: MachineProfiles
                },
                {
                    label: 'Probe',
                    component: ProbeSettings
                }
            ],
            tools: store.get('workspace[tools]', []),
            probeProfiles: store.get('workspace[probeProfiles]', []),
            tool: {
                metricDiameter: 0,
                imperialDiameter: 0,
                type: 'end mill'
            },
            probe: {
                id: 'Custom Probe Profile',
                xyThickness: 10,
                zThickness: 10,
                functions: {
                    x: false,
                    y: false,
                    z: false
                }
            },
            probeSettings: {
                retractionDistance: Number(this.probeConfig.get('retractionDistance') || 0).toFixed(3) * 1,
                normalFeedrate: Number(this.probeConfig.get('probeFeedrate') || 0).toFixed(3) * 1,
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
            changeId: (e) => {
                const probe = { ...this.state.probe };
                const id = e.target.value;
                this.setState({
                    probe: {
                        ...probe,
                        id: id
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
            addProbeProfile: () => {
                const probes = [...this.state.probeProfiles];
                const probe = this.state.probe;
                probes.push(probe);
                this.setState({
                    probeProfiles: probes
                });
            },
            deleteProbe: (index) => {
                const probes = [...this.state.probeProfiles];
                probes.splice(index, 1);
                this.setState({
                    probeProfiles: [...probes]
                });
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { tools, tool, probeProfiles, probeSettings } = this.state;

        store.replace('workspace[tools]', tools);
        store.set('workspace[tool]', tool);
        store.replace('workspace[probeProfiles]', probeProfiles);
        this.probeConfig.set('retractionDistance', probeSettings.retractionDistance);
        this.probeConfig.set('probeFeedrate', probeSettings.normalFeedrate);
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
                        <div className={ styles.preferencesOptions }>
                            {
                                menu.map((menuItem, index) => (
                                    <div>
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
