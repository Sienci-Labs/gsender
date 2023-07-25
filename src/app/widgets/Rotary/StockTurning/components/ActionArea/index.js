import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import pubsub from 'pubsub-js';

import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';
import api from 'app/api';
import controller from 'app/lib/controller';
import { VISUALIZER_SECONDARY } from 'app/constants';

import { Container } from './styled';
import { RotaryContext } from '../../../Context';
import { StockTurningGenerator } from '../../Generator';
import { SET_STOCK_TURNING_OUTPUT, CLOSE_ACTIVE_DIALOG } from '../../../Context/actions';

const Actions = () => {
    const { state, dispatch } = useContext(RotaryContext);

    const runGenerate = async () => {
        const stockTurning = new StockTurningGenerator(state.stockTurning.options);

        stockTurning.generate();

        dispatch({ type: SET_STOCK_TURNING_OUTPUT, payload: stockTurning.gcode });

        const serializedFile = new File([stockTurning.gcode], 'stockturning.gcode');

        await api.file.upload(serializedFile, controller.port, VISUALIZER_SECONDARY);
    };

    const loadGcode = () => {
        const { gcode } = state.stockTurning;
        const name = 'gSender_StockTurning';
        const { size } = new File([gcode], name);

        pubsub.publish('gcode:surfacing', { gcode, name, size });

        dispatch({ type: CLOSE_ACTIVE_DIALOG });
    };

    return (
        <Container>
            <ToolModalButton
                icon="fas fa-code"
                style={{ margin: 0 }}
                onClick={runGenerate}
            >
                Generate G-code
            </ToolModalButton>

            <ToolModalButton
                icon="fas fa-play"
                style={{ margin: 0 }}
                onClick={loadGcode}
            >
                Run on Main Visualizer
            </ToolModalButton>
        </Container>
    );
};

Actions.propTypes = {
    handleGenerateGcode: PropTypes.func,
    handleLoadGcode: PropTypes.func,
    surfacing: PropTypes.object,
    canLoad: PropTypes.bool,
};

export default Actions;
