import React from 'react';
import PropTypes from 'prop-types';

import Line from './Line';
import { Container } from './styled';

const GcodeViewer = ({ gcode }) => {
    return (
        <Container>
            {
                gcode.split('\n').map((line, i) => <Line key={`${i}-${line}`} number={i + 1} text={line} />)
            }
        </Container>
    );
};

GcodeViewer.propTypes = {
    gcode: PropTypes.string,
};

export default GcodeViewer;
