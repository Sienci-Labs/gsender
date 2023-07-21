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
import CoolantWidget from 'app/widgets/Coolant';
import WidgetConfig from '../WidgetConfig';
import ProbeWidget from '../Probe';
import RotaryWidget from '../Rotary';
import MacroWidget from '../Macro';
import ConsoleWidget from '../Console';

// import LaserWidget from '../Laser';
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
            this.setState({
                selectedTab: index
            });
        }
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
    }

    componentWillUnmount() {
        store.removeListener('change', this.handleMachineProfileChange);
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
                    label: 'Macros',
                    widgetId: 'macro',
                    component: MacroWidget,
                },
                {
                    label: 'Console',
                    widgetId: 'console',
                    component: ConsoleWidget,
                },
                {
                    label: 'Spindle/Laser',
                    widgetId: 'spindle',
                    component: SpindleWidget,
                },
                {
                    label: 'Coolant',
                    widgetId: 'coolant',
                    component: CoolantWidget
                },
                {
                    label: 'Rotary',
                    widgetId: 'rotary',
                    component: RotaryWidget
                },
            ]
        };
    }


    render() {
        const { isFullscreen, tabs, selectedTab } = this.state;
        const { onFork, onRemove, sortable } = this.props;
        const actions = { ...this.actions };

        return (
            <TabbedWidget fullscreen={isFullscreen}>
                <TabbedWidget.Tabs tabs={tabs} activeTabIndex={selectedTab} onClick={actions.handleTabSelect} />
                <TabbedWidget.Content>
                    {
                        tabs.map((tab, index) => {
                            const active = index === selectedTab;
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
            </TabbedWidget>
        );
    }
}

export default SecondaryFunctionality;
