/* eslint-disable no-restricted-globals */
/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import store from 'app/store';
import TabbedWidget from 'app/components/TabbedWidget';
import controller from 'app/lib/controller';
import RotaryWidget from 'app/widgets/Rotary';
import WidgetConfig from '../WidgetConfig';
import ProbeWidget from '../Probe';
import MacroWidget from '../Macro';
import ConsoleWidget from '../Console';
import MoreWidgets from '../MoreWidgets';
import CoolantWidgets from '../Coolant';
import RcDropdown from '../MoreWidgets/Dropdown';
import { TabsProvider } from './TabsContext';
import SpindleWidget from '../Spindle';

import {
    MODAL_NONE,
} from './constants';


class SecondaryFunctionality extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
        toggleDisabled: () => {
            const { disabled } = this.state;
            this.setState({ disabled: !disabled });
        },
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
        openModal: (name = MODAL_NONE, params = {}) => {
            this.setState({
                modal: {
                    name: name,
                    params: params
                }
            });
        },
        closeModal: () => {
            this.setState({
                modal: {
                    name: MODAL_NONE,
                    params: {}
                }
            });
        },
        refreshContent: () => {
            if (this.content) {
                const forceGet = true;
                this.content.reload(forceGet);
            }
        },
        handleTabSelect: (index) => {
            const { tabs } = this.state;
            const selectedTab = ['coolant', 'rotary'].includes(tabs[index].widgetId) ? tabs[index].widgetId : '';
            const widgetId = tabs[index].widgetId;

            this.setState({
                selectedTab: index,
            });
            if (widgetId !== 'more') {
                this.setState({ currentDropdownTab: selectedTab, });
            }
        },
        handleResize: () => {
            const { tabs, hiddenTabs } = this.state;
            const screenWidth = window.innerWidth;
            const updatedTabs = [...tabs];
            const moreTabs = [...hiddenTabs];

            // Widget Indexes in the main list
            const moreWidgetIndex = updatedTabs.findIndex(tab => tab.widgetId === 'more');
            const coolantWidgetIndex = updatedTabs.findIndex(tab => tab.widgetId === 'coolant');
            const rotaryWidgetIndex = updatedTabs.findIndex(tab => tab.widgetId === 'rotary');
            // Widget Indexes in the hidden list
            const hiddenCoolantIndex = moreTabs.findIndex(tab => tab.widgetId === 'coolant');
            const hiddenRotaryIndex = moreTabs.findIndex(tab => tab.widgetId === 'rotary');

            const moreWidgetObj = {
                label: <RcDropdown hiddenTabs={moreTabs} handleHighlightTab={this.actions.handleHighlightTab} />,
                widgetId: 'more',
                component: MoreWidgets,
            };

            const coolantWidgetObj = {
                label: 'Coolant',
                widgetId: 'coolant',
                component: CoolantWidgets
            };

            const rotaryWidgetObj = {
                label: 'Rotary',
                widgetId: 'rotary',
                component: RotaryWidget
            };

            // Screen width between 1248px and 1280px
            // Bring up 'more' tabs and display ONLY Coolant widget under it
            if (screenWidth >= 1248 && screenWidth <= 1281) {
                // if Coolant is in the main view, delete it
                if (coolantWidgetIndex !== -1) {
                    updatedTabs.splice(coolantWidgetIndex, 1);
                }

                // More tab should ONLY have Coolant tab
                if (hiddenCoolantIndex === -1) {
                    moreTabs.push(coolantWidgetObj);
                }
                if (hiddenRotaryIndex !== -1) {
                    moreTabs.splice(hiddenCoolantIndex, 1);
                }

                // if Rotary is not in the main list, add it
                if (rotaryWidgetIndex === -1) {
                    updatedTabs.splice(moreWidgetIndex, 0, rotaryWidgetObj);
                }

                // Check if more widget is not in the list, push it
                if (moreWidgetIndex === -1) {
                    updatedTabs.push(moreWidgetObj);
                }
            }

            // Screen width more than 1280 px
            // all tabs should appear in main list
            if (screenWidth > 1281) {
                // Check if coolant widget is not in the main list, push it
                if (coolantWidgetIndex === -1) {
                    updatedTabs.push(coolantWidgetObj);
                }
                // Check if Rotary widget is not in the main list, push it
                if (rotaryWidgetIndex === -1) {
                    updatedTabs.push(rotaryWidgetObj);
                }
                // if more options is in the list, delete it
                if (moreWidgetIndex !== -1) {
                    updatedTabs.splice(moreWidgetIndex, 1);
                }
                // Empty hidden array list
                moreTabs.length = 0;
            }

            // Screen width less than 1248px
            // Move both Rotary and Coolant under 'more' tab from main tab list
            if (screenWidth < 1248) {
                // Move Rotary under hidden list
                if (hiddenCoolantIndex === -1) {
                    moreTabs.push(coolantWidgetObj);
                }
                // Move Coolant under hidden list
                if (hiddenRotaryIndex === -1) {
                    moreTabs.push(rotaryWidgetObj);
                }

                // Delete Rotary and Coolant from main list if exists
                if (rotaryWidgetIndex !== -1) {
                    updatedTabs.splice(rotaryWidgetIndex, 1);
                }
                if (coolantWidgetIndex !== -1) {
                    updatedTabs.splice(coolantWidgetIndex, 1);
                }

                // Add more tab to the main tab list
                if (moreWidgetIndex === -1) {
                    updatedTabs.push(moreWidgetObj);
                }
            }

            this.setState({ hiddenTabs: moreTabs }); // Update the more tab list
            this.setState({ tabs: updatedTabs }); // Update the main tab list
        },
        //Logic to move tabs from hidden to the main view
        handleHighlightTab: (tab) => {
            // const { hiddenTabs, tabs } = this.state;
            // const moreTabs = [...hiddenTabs];
            // const updatedTabs = [...tabs];
            // // Widget Indexes in the main list
            // const consoleWidgetIndex = updatedTabs.findIndex(tab => tab.widgetId === 'console');
            // // Widget Indexes in the hidden list
            // const hiddenCoolantIndex = moreTabs.findIndex(tab => tab.widgetId === 'coolant');
            // const hiddenRotaryIndex = moreTabs.findIndex(tab => tab.widgetId === 'rotary');
            // const hiddenConsoleIndex = moreTabs.findIndex(tab => tab.widgetId === 'console');

            // const coolantWidgetObj = {
            //     label: 'Coolant',
            //     widgetId: 'coolant',
            //     component: CoolantWidgets
            // };

            // const rotaryWidgetObj = {
            //     label: 'Rotary',
            //     widgetId: 'rotary',
            //     component: RotaryWidget
            // };

            // const consoleWidgetObj = {
            //     label: 'Console',
            //     widgetId: 'console',
            //     component: ConsoleWidget,
            // };

            // switch (tab) {
            // case 'Rotary':
            //     if (hiddenRotaryIndex !== -1) {
            //         moreTabs.splice(hiddenRotaryIndex, 1);
            //         updatedTabs.splice(updatedTabs.length - 2, 0, rotaryWidgetObj);
            //     }
            //     if (consoleWidgetIndex !== -1) {
            //         updatedTabs.splice(consoleWidgetIndex, 1);
            //     }
            //     if (hiddenConsoleIndex === -1) {
            //         moreTabs.push(consoleWidgetObj);
            //     }
            //     break;
            // case 'Coolant':
            //     if (hiddenCoolantIndex !== -1) {
            //         moreTabs.splice(hiddenCoolantIndex, 1);
            //         updatedTabs.splice(updatedTabs.length - 2, 0, coolantWidgetObj);
            //     }
            //     if (consoleWidgetIndex !== -1) {
            //         updatedTabs.splice(consoleWidgetIndex, 1);
            //     }
            //     if (hiddenConsoleIndex === -1) {
            //         moreTabs.push(consoleWidgetObj);
            //     }
            //     break;
            // default:
            //     break;
            // }
            // console.log(moreTabs);
            // this.setState({
            //     tabs: updatedTabs,
            //     hiddenTabs: moreTabs
            // });
            console.log(tab, ' Highlighted');
        },
    };

    content = null;

    component = null;

    /**
     * Function to listen for store changes and add or remove the spindle tab from state
     */
    handleMachineProfileChange = () => {
        const machineProfile = store.get('workspace.machineProfile');

        if (!machineProfile) {
            return;
        }

        if (machineProfile.spindle) {
            const hasSpindleWidget = this.state.tabs.find(tab => tab.widgetId === 'spindle');
            if (!hasSpindleWidget) {
                this.setState((prev) => ({ ...prev, tabs: [...prev.tabs, { label: 'Spindle/Laser', widgetId: 'spindle', component: SpindleWidget }] }));
            }
        } else {
            const filteredTabs = this.state.tabs.filter(tab => tab.widgetId !== 'spindle');

            this.setState((prev) => ({ ...prev, selectedTab: prev.selectedTab === 3 ? 0 : prev.selectedTab, tabs: filteredTabs }));
        }
    }

    componentDidMount() {
        store.on('change', this.handleMachineProfileChange);
        this.handleMachineProfileChange();
        window.addEventListener('resize', this.actions.handleResize);

        // Check screen size and update currentDropdownTab state accordingly
        this.actions.handleResize();
    }

    componentWillUnmount() {
        store.removeListener('change', this.handleMachineProfileChange);
        window.removeEventListener('resize', this.actions.handleResize);
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            disabled,
            minimized,
            title,
            url
        } = this.state;
        this.config.set('disabled', disabled);
        this.config.set('minimized', minimized);
        this.config.set('title', title);
        this.config.set('url', url);
    }

    getInitialState() {
        return {
            minimized: this.config.get('minimized', false),
            isFullscreen: false,
            disabled: this.config.get('disabled'),
            port: controller.port,
            selectedTab: 0,
            tabs: [
                {
                    label: 'Probe',
                    widgetId: 'probe',
                    component: ProbeWidget,
                },
                {
                    label: 'Spindle/Laser',
                    widgetId: 'spindle',
                    component: SpindleWidget,
                },
                {
                    label: 'Rotary',
                    widgetId: 'rotary',
                    component: RotaryWidget
                },
                {
                    label: 'Macros',
                    widgetId: 'macro',
                    component: MacroWidget,
                },
                {
                    label: 'Console',
                    widgetId: 'console',
                    component: ConsoleWidget,
                },
            ],
            hiddenTabs: [],
            currentDropdownTab: ''
        };
    }

    render() {
        const { isFullscreen, tabs, selectedTab, currentDropdownTab } = this.state;
        const { onFork, onRemove, sortable } = this.props;
        const actions = { ...this.actions };

        const updateDropdownTab = (newTab) => {
            this.setState({ 'currentDropdownTab': newTab });
        };

        return (
            <TabsProvider value={{ currentDropdownTab: currentDropdownTab, updateDropdownTab: updateDropdownTab }}>
                <TabbedWidget fullscreen={isFullscreen}>
                    <TabbedWidget.Tabs tabs={tabs} activeTabIndex={selectedTab} onClick={actions.handleTabSelect} />
                    <TabbedWidget.Content>
                        {
                            tabs.map((tab, index) => {
                                const active = index === selectedTab;
                                return (
                                    <TabbedWidget.ChildComponent key={`${tab.widgetId}`} active={active} style={{ overflowX: 'auto' }}>
                                        <tab.component
                                            onFork={onFork}
                                            onRemove={onRemove}
                                            sortable={sortable}
                                            widgetId={tab.widgetId}
                                            embedded
                                            active={active}
                                            isMainWindow={true}
                                        />
                                    </TabbedWidget.ChildComponent>
                                );
                            })
                        }
                    </TabbedWidget.Content>
                </TabbedWidget>
            </TabsProvider>
        );
    }
}

export default SecondaryFunctionality;
