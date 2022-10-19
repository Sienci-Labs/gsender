import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import ToolModalButton from 'app/components/ToolModalButton/ToolModalButton';

import { Container } from './styled';
import { SurfacingContext } from '../Surfacing/Context';

const Actions = () => {
    const { canLoad, runGenerate, loadGcode } = useContext(SurfacingContext);

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
                disabled={!canLoad}
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
