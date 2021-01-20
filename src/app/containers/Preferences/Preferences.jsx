import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import GeneralSettings from './GeneralSettings';
import ToolSettings from './Tools/Tools';
import MachineProfiles from './MachineProfiles';
import ProbeSettings from './ProbeSettings';
import WidgetConfig from '../../widgets/WidgetConfig';
import store from '../../store';
import styles from './index.styl';


class PreferencesPage extends PureComponent {
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
            tool: {
                metricDiameter: 0,
                imperialDiameter: 0,
                type: 'end mill'
            },
            probeConfig: new WidgetConfig('probe')
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
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { tools, tool } = this.state;

        store.replace('workspace[tools]', tools);
        store.set('workspace[tool]', tool);
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
