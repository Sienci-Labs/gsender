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
import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import TabbedWidget from 'app/components/TabbedWidget';
import store from 'app/store';
// import _ from 'lodash';
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
    const [selectedTab, setSelectedTab] = useState(0);
    const [currentDropdownTab, setCurrentDropdownTab] = useState('');

    const updateDropdownTab = (newTab) => {
        setCurrentDropdownTab(newTab);
    };

    const { isFullscreen, tabs } = state;
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
            setSelectedTab(index);
        },
        handleResize: useCallback(() => {
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
                label: <RcDropdown />,
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
                if (moreTabs.length === 1) {
                    return;
                }
                // if Coolant is in the main view, delete it
                if (coolantWidgetIndex !== -1) {
                    updatedTabs.splice(coolantWidgetIndex, 1);
                }

                // More tab should ONLY have Coolant tab
                if (hiddenCoolantIndex === -1) {
                    moreTabs.push(coolantWidgetObj);
                }
                if (hiddenRotaryIndex !== -1) {
                    moreTabs.splice(hiddenRotaryIndex, 1);
                }

                // if Rotary is not in the main list, add it
                if (rotaryWidgetIndex === -1) {
                    updatedTabs.splice(2, 0, rotaryWidgetObj);
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
                    updatedTabs.splice(2, 0, rotaryWidgetObj);
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
                if (moreTabs.length === 2) {
                    return;
                }
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
            const highlight = tabs[selectedTab];
            let highlightIndex = updatedTabs.findIndex(tab => tab.widgetId === highlight.widgetId);

            if (highlightIndex === -1) {
                highlightIndex = updatedTabs.length - 1;
            }

            setSelectedTab(highlightIndex);
            updateDropdownTab(highlight.label);

            setState((prev) => ({ ...prev, hiddenTabs: moreTabs, tabs: updatedTabs })); // Update the both the lists
        }, [selectedTab]),

        // moveHighlightTab: (tab) => {
        //     setState((prev) => {
        //         const updatedTabs = [...prev.tabs];
        //         const updatedHiddenTabs = [...prev.hiddenTabs];
        //         let newSelectedTab = 0;

        //         // Find the index of the selected hidden tab
        //         const selectedHiddenTabIndex = updatedHiddenTabs.findIndex((t) => _.isEqual(t, tab));

        //         if (selectedHiddenTabIndex !== -1 && updatedHiddenTabs.length > 1) {
        //             // Remove the selected hidden tab from hiddenTabs
        //             updatedHiddenTabs.splice(selectedHiddenTabIndex, 1);

        //             // Add the second last tab from tabs to hiddenTabs
        //             const swap = updatedTabs[updatedTabs.length - 2];
        //             updatedTabs.splice(updatedTabs.length - 2, 1);// Remove from tab
        //             updatedHiddenTabs.push(swap);// And add to hidden tab
        //             // Add the selected hidden tab at the second last position in tabs
        //             updatedTabs.splice(updatedTabs.length - 2, 0, tab);
        //             newSelectedTab = updatedTabs.length - 2;
        //         }

        //         return {
        //             ...prev,
        //             tabs: updatedTabs,
        //             hiddenTabs: updatedHiddenTabs,
        //             selectedTab: newSelectedTab
        //         };
        //     });
        // }

    };

    function getInitialState() {
        return {
            minimized: config.get('minimized', false),
            isFullscreen: false,
            disabled: config.get('disabled'),
            port: controller.port,
            tabs: [
                {
                    label: 'Probe',
                    widgetId: 'probe',
                    component: ProbeWidget,
                },
                store.get('workspace.machineProfile').spindle
                    ? { label: 'Spindle/Laser',
                        widgetId: 'spindle',
                        component: SpindleWidget } : null,
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
            ].filter(Boolean),
            hiddenTabs: [],
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
                const tempList = [...state.tabs];
                tempList.splice(1, 0, { label: 'Spindle/Laser', widgetId: 'spindle', component: SpindleWidget });
                setState((prev) => ({ ...prev, tabs: tempList }));
            }
        } else {
            const filteredTabs = state.tabs.filter((tab) => tab.widgetId !== 'spindle');
            setSelectedTab(selectedTab === 1 ? 0 : selectedTab);
            setState((prev) => ({
                ...prev,
                tabs: filteredTabs
            }));
        }
    };

    useEffect(() => {
        store.on('change', handleMachineProfileChange);
        window.addEventListener('resize', actions.handleResize);
        handleMachineProfileChange();
        actions.handleResize();
        return () => {
            window.removeEventListener('resize', actions.handleResize);
            store.removeListener('change', handleMachineProfileChange);
        };
    }, [actions.handleResize]);

    const { hiddenTabs } = state;
    return (
        <TabsProvider value={{ currentDropdownTab, updateDropdownTab, hiddenTabs }}>
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
