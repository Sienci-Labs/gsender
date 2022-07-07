import React, { useState, useEffect } from 'react';

import TabbedWidget from 'app/components/TabbedWidget';
import ReactHTMLTableToExcel from 'react-html-table-to-excel';
import store from '../../../store';

import KeyboardShortcuts from './Keybindings';
import Joystick from './Joystick';
//import { downloadShortcuts } from './helpers';

import SettingWrapper from '../components/SettingWrapper';
import styles from '../index.styl';

const tabs = [
    {
        id: 0,
        label: 'Keyboard Shortcuts',
        widgetId: 'keyboard-shortcuts',
        component: <KeyboardShortcuts />,
    },
    {
        id: 1,
        label: 'Joystick Shortcuts',
        widgetId: 'joystick-shortcuts',
        component: <Joystick />,
    },
];

const Shortcuts = ({ active }) => {
    const [tab, setTab] = useState(0);
    const [shortcuts, setShortcuts] = useState([
        { },
    ]);

    useEffect(() => {
        setShortcuts(store.get('commandKeys'));
    }, []);

    return (
        <SettingWrapper title="Shortcuts" show={active}>
            <TabbedWidget>
                <div className={styles.shortcutWrapper}>
                    <ReactHTMLTableToExcel
                        id="test-table-xls-button"
                        className="download-table-xls-button"
                        table="table-to-xls"
                        filename="shortcuts"
                        sheet="shortcuts"
                        buttonText="Download to print"
                    />
                    <table id="table-to-xls" style={{ display: 'none' }}>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Shortcut</th>
                                <th>Category</th>
                                <th>Active Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shortcuts.map((shortcut) => {
                                const { title, keys, category, isActive } =
                                shortcut;
                                return (
                                    <tr key={title}>
                                        <td>{title}</td>
                                        <td>{keys}</td>
                                        <td>{category}</td>
                                        <td>{isActive}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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
        </SettingWrapper>
    );
};

export default Shortcuts;
