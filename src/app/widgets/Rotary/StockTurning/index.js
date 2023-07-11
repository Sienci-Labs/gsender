import React, { useContext } from 'react';

import Modal from 'app/components/ToolModal/ToolModal';
import { RotaryContext } from '../Context';
import { MODALS } from '../utils/constants';
import { CLOSE_ACTIVE_DIALOG } from '../Context/actions';
import InputArea from './components/InputArea';

import styles from './index.styl';

const StockTurning = () => {
    const { state: { activeDialog }, dispatch } = useContext(RotaryContext);

    return (
        <Modal
            title="Stock Turning Wizard"
            show={activeDialog === MODALS.STOCK_TURNING}
            onClose={() => dispatch({ type: CLOSE_ACTIVE_DIALOG })}
            size="lg"
        >
            <div className={styles.wrapper}>
                <InputArea />
            </div>
        </Modal>
    );
};

export default StockTurning;
