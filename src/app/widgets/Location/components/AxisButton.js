import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { PRIMARY_COLOR, SECONDARY_COLOR } from '../constants';

//Main styles
const Container = styled.div`
        text-align: center;
        border: 2px solid ${PRIMARY_COLOR};
        border-radius: 5px;
        width: 100%;
        max-width: 5rem;
        min-width: 4rem;
        transition: 200ms ease-in-out;

        &.active:hover {
            color: white;
            background-color: ${PRIMARY_COLOR};
            transition: 200ms ease-in-out;

            h3 {
                color: white;
                transition: 200ms ease-in-out;
            }
        }

        &.disabled {
            color: ${SECONDARY_COLOR};
            border: 2px solid ${SECONDARY_COLOR};
            cursor: no-drop;

            h3 {
                color: ${SECONDARY_COLOR};
                transition: 200ms ease-in-out;
            }
        }
    
    &:focus {
        outline: none;
    }
    &:active{
        outline: none;
    }

    h3 {
        font-weight: 600;
        font-size: clamp(12px, 1vw, 32px);
        margin-top: -5px;
    }

    p {
        font-size: clamp(9px,0.5vw,14px);
    }

    p, h3 {
        margin: 1px;
    }

`;

const AxisButton = ({ label, axis, onClick, disabled }) => {
    return (
        <Container
            role="button"
            onClick={onClick}
            onKeyDown={onClick}
            tabIndex={0}
            className={disabled ? 'disabled' : 'active'}
        >
            <p>{label}</p>

            <h3>{axis.toUpperCase()}</h3>
        </Container>
    );
};

AxisButton.propTypes = {
    label: PropTypes.string,
    axis: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

AxisButton.defaultProps = {
    label: 'Zero'
};

export default AxisButton;
