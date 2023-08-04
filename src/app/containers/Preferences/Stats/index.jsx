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

import React, { useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import reduxStore from 'app/store/redux';

import TabbedWidget from 'app/components/TabbedWidget';
import SettingWrapper from '../components/SettingWrapper';
import StatsList from './StatsList';
import JobTable from './components/index';
import styles from './index.styl';

const tabs = [
    {
        id: 0,
        label: 'Statistics',
        widgetId: 'job-stats',
        component: <StatsList />,
    },
    {
        id: 1,
        label: 'Job Table',
        widgetId: 'job-table',
        component: <JobTable />,
    },
    {
        id: 2,
        label: 'Maintenance',
        widgetId: 'maintenance',
        component: <div></div>,
    },
];

const StatsPage = ({ active, state, actions }) => {
    const [tab, setTab] = useState(0);

    return (
        <SettingWrapper title="Job History & Stats" show={active}>
            <ReduxProvider store={reduxStore}>
                <TabbedWidget>
                    <TabbedWidget.Tabs
                        tabs={tabs}
                        activeTabIndex={tab}
                        onClick={(index) => setTab(index)}
                        className={styles.tabs}
                    />
                    <TabbedWidget.Content>
                        <div className={styles.container}>
                            {tabs.map((t, index) => {
                                const active = index === tab;
                                return (
                                    <TabbedWidget.ChildComponent
                                        key={t.id}
                                        active={active}
                                    >
                                        {active && t.component}
                                    </TabbedWidget.ChildComponent>
                                );
                            })}
                        </div>
                    </TabbedWidget.Content>
                </TabbedWidget>
            </ReduxProvider>
        </SettingWrapper>
    );
};

export default StatsPage;
