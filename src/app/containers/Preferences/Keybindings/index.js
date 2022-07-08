import React, { useState, useRef } from 'react';

import TabbedWidget from 'app/components/TabbedWidget';
import ReactToPrint from 'react-to-print';
import ShortcutTable from './ShortcutTable';

import KeyboardShortcuts from './Keybindings';
import Joystick from './Joystick';

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
    //const [display, setDisplay] = useState('none');
    const componentRef = useRef();
    return (
        <SettingWrapper title="Shortcuts" show={active}>
            <TabbedWidget>
                <ReactToPrint
                    trigger={() => {
                        return <button>Print</button>;
                    }}
                    content={() => componentRef.current}
                    documentTitle="Shortcuts"
                    // onBeforePrint={() => setDisplay('block')}
                    // onAfterPrint={() => setDisplay('none')}
                />
                <ShortcutTable forwardRef={componentRef} />
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
