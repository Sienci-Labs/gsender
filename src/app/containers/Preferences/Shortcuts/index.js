import React, { useState } from 'react';

import TabbedWidget from 'app/components/TabbedWidget';

import KeyboardShortcuts from './Keyboard';
import Gamepad from './Gamepad';

import SettingWrapper from '../components/SettingWrapper';
import styles from '../index.styl';

const tabs = [
    {
        id: 0,
        label: 'Keyboard',
        widgetId: 'keyboard-shortcuts',
        component: <KeyboardShortcuts />,
    },
    {
        id: 1,
        label: 'Gamepad',
        widgetId: 'gamepad-shortcuts',
        component: <Gamepad />,
    },
];

const Shortcuts = ({ active }) => {
    const [tab, setTab] = useState(0);

    return (
        <SettingWrapper title="Shortcuts" show={active}>
            <TabbedWidget>
                <TabbedWidget.Tabs
                    tabs={tabs}
                    activeTabIndex={tab}
                    onClick={(index) => setTab(index)}
                    className={styles.tabs}
                />
                <TabbedWidget.Content>
                    <div className={styles.container}>
                        {
                            tabs.map((t, index) => {
                                const active = index === tab;
                                return (
                                    <TabbedWidget.ChildComponent key={t.id} active={active}>
                                        {active && t.component}
                                    </TabbedWidget.ChildComponent>
                                );
                            })
                        }
                    </div>
                </TabbedWidget.Content>
            </TabbedWidget>
        </SettingWrapper>
    );
};

export default Shortcuts;
