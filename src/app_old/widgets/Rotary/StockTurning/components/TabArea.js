import React from 'react';
import PropTypes from 'prop-types';

import TabbedWidget from 'app/components/TabbedWidget';
import { SURFACING_VISUALIZER_CONTAINER_ID } from 'app/constants';


const TabArea = ({ tabs, currentTab, onTabChange, mountAllTabs = false }) => {
    return (
        <TabbedWidget>
            <TabbedWidget.Tabs
                tabs={tabs}
                activeTabIndex={currentTab}
                onClick={onTabChange}
                style={{ backgroundColor: '#e5e7eb' }}
            />
            <TabbedWidget.Content>
                <div style={{ width: '100%', height: '100%', position: 'relative' }} id={SURFACING_VISUALIZER_CONTAINER_ID}>
                    {
                        tabs.map((tab, index) => {
                            const active = index === currentTab;

                            if (mountAllTabs) {
                                return (
                                    <TabbedWidget.ChildComponent key={tab.id} active={active}>
                                        {tab.component}
                                    </TabbedWidget.ChildComponent>
                                );
                            }

                            return (
                                <TabbedWidget.ChildComponent key={tab.id} active={active}>
                                    {active && tab.component}
                                </TabbedWidget.ChildComponent>
                            );
                        })
                    }
                </div>
            </TabbedWidget.Content>
        </TabbedWidget>
    );
};

TabArea.propTypes = {
    tabs: PropTypes.array,
    currentTab: PropTypes.number,
    onTabChange: PropTypes.func,
};

export default TabArea;
