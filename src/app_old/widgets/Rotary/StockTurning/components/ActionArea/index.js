import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import { useSelector } from 'react-redux';

import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';

import { Container } from './styled';
import { RotaryContext } from '../../../Context';


const Actions = ({ loadGcode, generateGcode }) => {
    const { state } = useContext(RotaryContext);
    const controllerState = useSelector(store => get(store, 'controller.state'));
    const isFileRunning = controllerState.status?.activeState === 'Hold' || controllerState.status?.activeState === 'Run';

    return (
        <Container>
            <ToolModalButton
                icon="fas fa-code"
                style={{ margin: 0 }}
                onClick={generateGcode}
                disabled={isFileRunning}
            >
                Generate G-code
            </ToolModalButton>

            <ToolModalButton
                icon="fas fa-play"
                style={{ margin: 0 }}
                onClick={loadGcode}
                disabled={!state.stockTurning.gcode && isFileRunning}
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
