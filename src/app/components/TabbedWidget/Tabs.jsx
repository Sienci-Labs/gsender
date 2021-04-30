/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

import classNames from 'classnames';
import React from 'react';
import WidgetStyles from '../Widget/index.styl';
import Tab from './Tab';
import styles from './index.styl';


const Tabs = ({ className, tabs, activeTabIndex, onClick, ...props }) => (
    <div
        {...props}
        className={classNames(
            className,
            WidgetStyles.widgetHeader,
            styles.tabRow
        )}
    >
        {
            tabs.map((tab, index) => (
                <Tab
                    active={index === activeTabIndex}
                    onClick={() => onClick(index)}
                    key={`tab-${tab.widgetId}`}
                >
                    {tab.label}
                </Tab>
            ))
        }
    </div>
);

export default Tabs;
