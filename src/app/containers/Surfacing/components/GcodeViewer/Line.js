import React from 'react';
import PropTypes from 'prop-types';

import { StyledLine } from './styled';

const Line = ({ number, text }) => {
    return (
        <StyledLine.Wrapper>
            <StyledLine.Number>{number}</StyledLine.Number>{' '}
            <StyledLine.Text>{text}</StyledLine.Text>
        </StyledLine.Wrapper>
    );
};

Line.propTypes = {
    number: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired
};

export default Line;
