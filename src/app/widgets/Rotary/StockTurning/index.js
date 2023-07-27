import React, { useContext, useEffect } from 'react';

import Modal from 'app/components/ToolModal/ToolModal';
import GcodeViewer from 'app/components/GcodeViewer';
import { SET_CURRENT_VISUALIZER } from 'app/actions/visualizerActions';
import { VISUALIZER_PRIMARY, VISUALIZER_SECONDARY } from 'app/constants';
import store from 'app/store';
import reduxStore from 'app/store/redux';

import { RotaryContext } from '../Context';
import { MODALS } from '../utils/constants';
import { CLOSE_ACTIVE_DIALOG, SET_STOCK_TURNING_OUTPUT, CONVERT_STOCK_TURNING_OPTIONS_TO_IMPERIAL, SET_ACTIVE_STOCK_TURNING_TAB } from '../Context/actions';
import InputArea from './components/InputArea';

import styles from './index.styl';
import ActionArea from './components/ActionArea';
import TabArea from './components/TabArea';
import Visualizer from './components/Visualizer';

const StockTurning = () => {
    const { state: { activeDialog, stockTurning }, dispatch } = useContext(RotaryContext);

    useEffect(() => {
        reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_SECONDARY });

        const units = store.get('workspace.units');

        if (units === 'in') {
            dispatch({ type: CONVERT_STOCK_TURNING_OPTIONS_TO_IMPERIAL });
        }

        return () => {
            if (units === 'mm') {
                store.replace('widgets.rotary.stockTurning.options', stockTurning.options);
            }

            reduxStore.dispatch({ type: SET_CURRENT_VISUALIZER, payload: VISUALIZER_PRIMARY });
        };
    }, []);

    const handleClose = () => {
        dispatch({ type: CLOSE_ACTIVE_DIALOG });
        dispatch({ type: SET_STOCK_TURNING_OUTPUT, payload: null });
    };

    const { gcode, activeTab } = stockTurning;

    const tabs = [
        {
            id: 0,
            label: 'Visualizer Preview',
            widgetId: 'viz-preview',
            component: <Visualizer gcode={gcode} />,
        },
        {
            id: 1,
            label: `G-code Viewer ${gcode ? `(${gcode.split('\n').length} lines)` : ''}`,
            widgetId: 'gcode-viewer',
            component: <GcodeViewer gcode={gcode} />,
            disabled: !gcode,
        },
    ];

    return (
        <Modal
            title="Stock Turning Wizard"
            show={activeDialog === MODALS.STOCK_TURNING}
            onClose={handleClose}
            size="lg"
        >
            <div className={styles.wrapper}>
                <InputArea />

                <div style={{ width: '55%' }}>
                    <TabArea
                        tabs={tabs}
                        currentTab={activeTab}
                        onTabChange={(index) => dispatch({ type: SET_ACTIVE_STOCK_TURNING_TAB, payload: index })}
                    />
                </div>
            </div>

            <ActionArea />
        </Modal>
    );
};

export default StockTurning;
