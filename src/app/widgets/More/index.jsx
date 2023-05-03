import React, { useState } from 'react';
import Dropdown from 'rc-dropdown';
import styled from 'styled-components';
import styles from './index.styl';
import Rotary from '../Rotary';

const More = () => {
    const tabs = [
        {
            label: 'Rotary',
            widgetId: 'rotary',
            component: Rotary
        },
        {
            label: 'Test',
            widgetId: 'test',
            component: () => <div> This is a test widget</div>
        },
    ];
    const [currentTab, setCurrentTab] = useState(tabs[0]);
    const handleTabSelect = (tab) => {
        setCurrentTab(tab);
    };
    const MenuWrapper = styled.div`
      overflow-y: auto;
    `;
    const Menu = (
        <div className={styles.dropdown}>
            {
                tabs.map((tab) => {
                    return (
                        <div
                            className={styles['macro-menu-item']}
                            style={{ marginBottom: '5px' }}
                            onClick={() => handleTabSelect(tab)}
                            onKeyDown={null}
                            tabIndex={-1}
                            role="button"
                            key={tab.id}
                        >
                            <span>{tab.label}</span>
                        </div>
                    );
                })
            }
        </div>
    );
    return (
        <MenuWrapper>
            <Dropdown
                trigger={['click']}
                overlay={Menu}
                animation="slide-up"
            >
                <button>{currentTab.label} ▼</button>
            </Dropdown>
            <currentTab.component />
        </MenuWrapper>
    );
};

export default More;
