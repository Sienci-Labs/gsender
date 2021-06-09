import React, { useState } from 'react';
import PropTypes from 'prop-types';

import TabbedWidget from 'app/components/TabbedWidget';
import ToolModal from 'app/components/ToolModal/ToolModal';

import Alignment from './Alignment';

import styles from './index.styl';

import Tab from './Tab';

const Calibration = ({ modalClose }) => {
    const [tab, setTab] = useState(0);

    const tabs = [
        {
            id: 0,
            label: 'Alignment',
            widgetId: 'calibration-alignment',
            component: <Alignment />,
        },
        {
            id: 1,
            label: 'Axis Tuning',
            widgetId: 'calibration-axis-tuning',
            component: <Tab title="Axis Tuning" />,
        },
        {
            id: 2,
            label: 'Surfacing Wasteboard',
            widgetId: 'calibration-surfacing',
            component: <Tab title="Surfacing Wasteboard" />,
        },
    ];

    return (
        <ToolModal onClose={modalClose} size="large" title="Calibration Tool">
            <TabbedWidget>
                <TabbedWidget.Tabs
                    tabs={tabs}
                    activeTabIndex={tab}
                    onClick={(index) => setTab(index)}
                    className={styles.tabs}
                >
                </TabbedWidget.Tabs>
                <TabbedWidget.Content>
                    <div className={styles.container}>
                        {
                            tabs.map((t, index) => {
                                const active = index === tab;
                                return (
                                    <TabbedWidget.ChildComponent key={t.id} active={active}>
                                        {t.component}
                                    </TabbedWidget.ChildComponent>
                                );
                            })
                        }
                    </div>
                </TabbedWidget.Content>
            </TabbedWidget>
        </ToolModal>
    );
};

Calibration.propTypes = {
    modalClose: PropTypes.func,
};

export default Calibration;
