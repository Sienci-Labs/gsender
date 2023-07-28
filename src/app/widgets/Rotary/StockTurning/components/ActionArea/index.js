import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';

import { Container } from './styled';
import { RotaryContext } from '../../../Context';


const Actions = ({ loadGcode, generateGcode }) => {
    const { state } = useContext(RotaryContext);

    return (
        <Container>
            <ToolModalButton
                icon="fas fa-code"
                style={{ margin: 0 }}
                onClick={generateGcode}
            >
                Generate G-code
            </ToolModalButton>

            <ToolModalButton
                icon="fas fa-play"
                style={{ margin: 0 }}
                onClick={loadGcode}
                disabled={!state.stockTurning.gcode}
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
