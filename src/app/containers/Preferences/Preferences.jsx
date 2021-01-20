import Modal from 'app/components/Modal';
import React, { PureComponent } from 'react';
import GeneralSettings from './GeneralSettings';
import ToolSettings from './Tools/Tools';
import MachineProfiles from './MachineProfiles';
import ProbeSettings from './ProbeSettings';
import WidgetConfig from '../../widgets/WidgetConfig';
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
            tools: [
                {
                    metricDiameter: 3.175,
                    imperialDiameter: 0.125,
                    type: 'end mill'
                },
                {
                    metricDiameter: 6.35,
                    imperialDiameter: 0.25,
                    type: 'end mill'
                },
                {
                    metricDiameter: 9.525,
                    imperialDiameter: 0.375,
                    type: 'end mill'
                },
                {
                    metricDiameter: 12.7,
                    imperialDiameter: 0.5,
                    type: 'end mill'
                },
                {
                    metricDiameter: 15.875,
                    imperialDiameter: 0.625,
                    type: 'end mill'
                }
            ],
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
                const diameter = e.target.value;
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
                const diameter = e.target.value;
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
                console.log(tool);
                console.log(tools);
                tools.push(tool);
                this.setState({
                    tools: tools
                });
            }
        }
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
