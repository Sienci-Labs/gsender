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
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import TabbedWidget from 'app/components/TabbedWidget';
import store from 'app/store';
import RotaryWidget from 'app/widgets/Rotary';
import controller from 'app/lib/controller';
import MoreWidgets from '../MoreWidgets';
import CoolantWidgets from '../Coolant';
import RcDropdown from '../MoreWidgets/Dropdown';
import ProbeWidget from '../Probe';
import MacroWidget from '../Macro';
import ConsoleWidget from '../Console';
import {
    MODAL_NONE,
} from './constants';
import WidgetConfig from '../WidgetConfig';
import { TabsProvider } from './TabsContext';
import SpindleWidget from '../Spindle';

const SecondaryFunctionality = ({ widgetId, onFork, onRemove, sortable }) => {
    const config = new WidgetConfig(widgetId);
    const [state, setState] = useState(getInitialState());

    const updateDropdownTab = (newTab) => {
        setState((prev) => ({ ...prev, currentDropdownTab: newTab }));
    };

    const { isFullscreen, tabs, selectedTab, currentDropdownTab } = state;
    const actions = {
        toggleDisabled: () => {
            const { disabled } = state;
            setState((prev) => ({ ...prev, disabled: !disabled }));
        },
        toggleFullscreen: () => {
            const { minimized, isFullscreen } = state;
            setState((prev) => ({
                ...prev,
                minimized: isFullscreen ? minimized : false,
                isFullscreen: !isFullscreen
            }));
        },
        toggleMinimized: () => {
            const { minimized } = state;
            setState((prev) => ({ ...prev, minimized: !minimized }));
        },
        openModal: (name = MODAL_NONE, params = {}) => {
            setState((prev) => ({
                ...prev,
                modal: {
                    name: name,
                    params: params
                }
            }));
        },
        closeModal: () => {
            setState((prev) => ({
                ...prev,
                modal: {
                    name: MODAL_NONE,
                    params: {}
                }
            }));
        },
        handleTabSelect: (index) => {
            const { tabs } = state;
            const selectedTab = ['coolant', 'rotary'].includes(tabs[index].widgetId) ? tabs[index].widgetId : '';
            const widgetId = tabs[index].widgetId;

            setState((prev) => ({
                ...prev,
                selectedTab: index,
            }));
            if (widgetId !== 'more') {
                setState((prev) => ({ ...prev, currentDropdownTab: selectedTab, }));
            }
        },
        handleResize: () => {
            const { tabs, hiddenTabs } = state;
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
                label: <RcDropdown hiddenTabs={moreTabs} handleHighlightTab={actions.handleHighlightTab} />,
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
                // Move Coolant under hidden list
                if (hiddenCoolantIndex === -1) {
                    moreTabs.push(coolantWidgetObj);
                }
                // Move Rotary under hidden list
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
            setState((prev) => ({ ...prev, hiddenTabs: moreTabs })); // Update the more tab list
            setState((prev) => ({ ...prev, tabs: updatedTabs })); // Update the main tab list
        },
        handleHighlightTab: (tab) => {
            const { tabs, hiddenTabs } = state;

            const updatedTabs = [...tabs];
            const updatedHiddenTabs = [...hiddenTabs];

            console.log('Hidden tabs in the beginning: ', updatedHiddenTabs);
            console.log('Main tabs in the beginning: ', updatedTabs);


            // /// Widget Indexes in the hidden list
            // const hiddenConsoleIndex = updatedHiddenTabs.findIndex(tab => tab.widgetId === 'console');
            // const hiddenCoolantIndex = updatedHiddenTabs.findIndex(tab => tab.widgetId === 'coolant');
            // const hiddenRotaryIndex = updatedHiddenTabs.findIndex(tab => tab.widgetId === 'rotary');

            // // Widget Indexes in the main list
            // const consoleWidgetIndex = updatedTabs.findIndex(tab => tab.widgetId === 'console');
            // const coolantWidgetIndex = updatedTabs.findIndex(tab => tab.widgetId === 'coolant');
            // const rotaryWidgetIndex = updatedTabs.findIndex(tab => tab.widgetId === 'rotary');

            // // Tab objects
            // const consoleWidgetObj = {
            //     label: 'Console',
            //     widgetId: 'console',
            //     component: ConsoleWidget
            // };
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

            // // Swap with Console every time
            // // Move selected tab to main view for better clarity
            // // TODO - add more cases for new tabs in future
            // switch (tab) {
            // case 'Rotary':
            //     // If Rotary in hidden list, delete it
            //     if (hiddenRotaryIndex !== -1) {
            //         updatedHiddenTabs.splice(hiddenRotaryIndex, 1);
            //         console.log('Rotary deleted from hidden list: ', updatedTabs);
            //     }
            //     // If Rotary not in main list, add it
            //     if (rotaryWidgetIndex === -1) {
            //         updatedTabs.push(rotaryWidgetObj);
            //         console.log('Rotary added in main list: ', updatedTabs);
            //     }
            //     //If Console in main list, delete it
            //     if (consoleWidgetIndex !== -1) {
            //         updatedTabs.splice(consoleWidgetIndex, 1);
            //         console.log('Console deleted from main list: ', updatedTabs);
            //     }
            //     // If Console not in hidden list, add it
            //     if (hiddenConsoleIndex === -1) {
            //         updatedHiddenTabs.push(consoleWidgetObj);
            //         console.log('Console added to hidden list: ', updatedTabs);
            //     }
            //     break;
            // case 'Coolant':
            //     // If Coolant in hidden list, delete it
            //     if (hiddenCoolantIndex !== -1) {
            //         updatedHiddenTabs.splice(hiddenCoolantIndex, 1);
            //     }
            //     // If Coolant not in main list, add it
            //     if (coolantWidgetIndex === -1) {
            //         updatedTabs.push(coolantWidgetObj);
            //     }
            //     //If Console in main list, delete it
            //     if (consoleWidgetIndex !== -1) {
            //         updatedTabs.splice(coolantWidgetIndex, 1);
            //     }
            //     // If Console not in hidden list, add it
            //     if (hiddenConsoleIndex === -1) {
            //         updatedHiddenTabs.push(consoleWidgetObj);
            //     }
            //     break;
            // default:
            //     break;
            // }
            // setState((prev) => ({ ...prev, tabs: updatedTabs, hiddenTabs: updatedHiddenTabs }));
        }
    };

    function getInitialState() {
        return {
            minimized: config.get('minimized', false),
            isFullscreen: false,
            disabled: config.get('disabled'),
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

    const handleMachineProfileChange = () => {
        const machineProfile = store.get('workspace.machineProfile');

        if (!machineProfile) {
            return;
        }

        if (machineProfile.spindle) {
            const hasSpindleWidget = state.tabs.find((tab) => tab.widgetId === 'spindle');
            if (!hasSpindleWidget) {
                setState((prev) => ({ ...prev, tabs: [...prev.tabs, { label: 'Spindle/Laser', widgetId: 'spindle', component: SpindleWidget }] }));
            }
        } else {
            const filteredTabs = state.tabs.filter((tab) => tab.widgetId !== 'spindle');
            setState((prev) => ({
                ...prev,
                selectedTab: prev.selectedTab === 3 ? 0 : prev.selectedTab,
                tabs: filteredTabs
            }));
        }
    };

    useEffect(() => {
        store.on('change', handleMachineProfileChange);
        handleMachineProfileChange();
        window.addEventListener('resize', actions.handleResize);
        actions.handleResize();

        return () => {
            store.removeListener('change', handleMachineProfileChange);
            window.removeEventListener('resize', actions.handleResize);
        };
    }, []);

    return (
        <TabsProvider value={{ currentDropdownTab, updateDropdownTab }}>
            <TabbedWidget fullscreen={isFullscreen}>
                <TabbedWidget.Tabs tabs={tabs} activeTabIndex={selectedTab} onClick={actions.handleTabSelect} />
                <TabbedWidget.Content>
                    {tabs.map((tab, index) => {
                        const active = index === selectedTab;
                        return (
                            <TabbedWidget.ChildComponent key={tab.widgetId} active={active} style={{ overflowX: 'auto' }}>
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
                    })}
                </TabbedWidget.Content>
            </TabbedWidget>
        </TabsProvider>
    );
};

SecondaryFunctionality.propTypes = {
    widgetId: PropTypes.string.isRequired,
    onFork: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    sortable: PropTypes.object
};

export default SecondaryFunctionality;
