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
import MuiTabs, { tabsClasses } from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

const Tabs = ({ className, tabs, activeTabIndex, onClick, sx, ...props }) => {
    return (
        <MuiTabs
            value={activeTabIndex}
            onChange={(_, val) => onClick(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
                [`& .${tabsClasses.scrollButtons}`]: {
                    '&.Mui-disabled': { opacity: 0.3 },
                },
                minHeight: '34px',
                ...sx,
            }}
            {...props}
        >
            {
                tabs.map((tab) => (
                    <Tab
                        key={`tab-${tab.widgetId}`}
                        label={tab.label}
                        disabled={tab.disabled}
                        sx={{
                            minWidth: '75px',
                            minHeight: '16px',
                            padding: '8px',
                            flexGrow: '1',
                            fontFamily: '\'Open Sans\', sans-serif',
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            color: '#6b7280',
                        }}
                    />
                ))
            }
        </MuiTabs>
    );
};

export default Tabs;
