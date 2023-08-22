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

import React from 'react';
import classNames from 'classnames';
import MuiTabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import WidgetStyles from '../Widget/index.styl';

import styles from './index.styl';


const Tabs = ({ className, tabs, activeTabIndex, onClick, ...props }) => {
    return (
        <MuiTabs
            value={activeTabIndex}
            onChange={(_, val) => onClick(val)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="scrollable auto tabs example"
            sx={{
                [`& .${tabsClasses.scrollButtons}`]: {
                    '&.Mui-disabled': { opacity: 0.3 },
                },
                [`& .${tabsClasses.flexContainer}`]: {
                    justifyContent: 'space-between'
                },
                minHeight: '32px',
            }}
            {...props}
            className={classNames(
                className,
                WidgetStyles.widgetHeader,
                styles.tabRow
            )}
        >
            {
                tabs.map((tab) => (
                    <Tab
                        key={`tab-${tab.widgetId}`}
                        label={tab.label}
                        sx={{ minWidth: '75px', minHeight: '16px', padding: '8px' }}
                    />
                ))
            }
        </MuiTabs>
    );
};

export default Tabs;
