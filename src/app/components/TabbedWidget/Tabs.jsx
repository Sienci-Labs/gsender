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
                >
                    {tab.label}
                </Tab>
            ))
        }
    </div>
);

export default Tabs;
