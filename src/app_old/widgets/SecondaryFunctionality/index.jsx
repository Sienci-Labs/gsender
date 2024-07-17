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

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { tabsClasses } from '@mui/material/Tabs';

import store from 'app/store';
import TabbedWidget from 'app/components/TabbedWidget';
import controller from 'app/lib/controller';
import CoolantWidget from 'app/widgets/Coolant';

import WidgetConfig from '../WidgetConfig';
import ProbeWidget from '../Probe';
import RotaryWidget from '../Rotary';
import MacroWidget from '../Macro';
import ConsoleWidget from '../Console';
import SpindleWidget from '../Spindle';

import { MODAL_NONE, } from './constants';
import { collectUserUsageData } from '../../lib/heatmap';
import { USAGE_TOOL_NAME } from '../../constants';


class SecondaryFunctionality extends PureComponent {
    static propTypes = {
        widgetId: PropTypes.string.isRequired,
        onFork: PropTypes.func.isRequired,
        onRemove: PropTypes.func.isRequired,
        sortable: PropTypes.object
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    collectHeatMapDataTimeout = null;

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
            this.setState({
                selectedTab: index
            });
        }
    };

    content = null;

    component = null;

    /**
     * Function to listen for store changes and display certain tabs
     */
    handleStoreChange = () => {
        this.setState(prev => ({
            ...prev,
            tabs: prev.tabs.map(tab => {
                if (tab.widgetId === 'spindle') {
                    const machineProfile = store.get('workspace.machineProfile', {});

                    return { ...tab, show: machineProfile.spindle };
                }

                if (tab.widgetId === 'rotary') {
                    const show = store.get('widgets.rotary.tab.show', false);

                    return { ...tab, show };
                }
                return tab;
            })
        }));
    }

    componentDidMount() {
        store.on('change', this.handleStoreChange);
        this.handleStoreChange();
    }

    componentWillUnmount() {
        store.removeListener('change', this.handleStoreChange);
    }

    componentDidUpdate(prevProps, prevState) {
        const {
            disabled,
            minimized,
            title,
            url,
            selectedTab
        } = this.state;

        this.config.set('disabled', disabled);
        this.config.set('minimized', minimized);
        this.config.set('title', title);
        this.config.set('url', url);

        if (prevState.selectedTab !== selectedTab) {
            clearTimeout(this.collectHeatMapDataTimeout);

            const currentTool = [
                USAGE_TOOL_NAME.PROBING,
                USAGE_TOOL_NAME.MACROS,
                USAGE_TOOL_NAME.CONSOLE,
                USAGE_TOOL_NAME.SPINDLE_LASER,
                USAGE_TOOL_NAME.COOLANT,
                USAGE_TOOL_NAME.ROTARY
            ][selectedTab];

            this.collectHeatMapDataTimeout = setTimeout(() => {
                collectUserUsageData(currentTool);
            }, 5000);
        }
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
                    show: true,
                },
                {
                    label: 'Macros',
                    widgetId: 'macro',
                    component: MacroWidget,
                    show: true,
                },
                {
                    label: 'Console',
                    widgetId: 'console',
                    component: ConsoleWidget,
                    show: true,
                },
                {
                    label: 'Spindle/Laser',
                    widgetId: 'spindle',
                    component: SpindleWidget,
                    show: true,
                },
                {
                    label: 'Coolant',
                    widgetId: 'coolant',
                    component: CoolantWidget,
                    show: true,
                },
                {
                    label: 'Rotary',
                    widgetId: 'rotary',
                    component: RotaryWidget,
                    show: true,
                },
            ],
            isFirstRender: true,
        };
    }

    render() {
        const { isFullscreen, tabs, selectedTab } = this.state;
        const { onFork, onRemove, sortable } = this.props;
        const actions = { ...this.actions };

        const filteredTabs = tabs.filter(tab => tab.show);
        const activeTab = filteredTabs[selectedTab] !== undefined ? selectedTab : 0;

        return (
            <TabbedWidget fullscreen={isFullscreen}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <TabbedWidget.Tabs
                        tabs={filteredTabs}
                        activeTabIndex={activeTab}
                        onClick={actions.handleTabSelect}
                        sx={{
                            [`& .${tabsClasses.flexContainer}`]: {
                                justifyContent: 'space-between'
                            },
                        }}
                    />
                    <TabbedWidget.Content>
                        {
                            filteredTabs.map((tab, index) => {
                                const active = index === activeTab;

                                return (
                                    <TabbedWidget.ChildComponent key={tab.widgetId} active={active}>
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
                </div>
            </TabbedWidget>
        );
    }
}

export default SecondaryFunctionality;
