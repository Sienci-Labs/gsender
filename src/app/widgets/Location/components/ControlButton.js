import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { PRIMARY_COLOR, SECONDARY_COLOR } from '../constants';

const Button = styled.button`
    border: 3px solid ${PRIMARY_COLOR};
    color: ${PRIMARY_COLOR};
    background-color: #fff;
    border-radius: 5px;
    width: 100%;
    max-width: 10rem;
    padding: 5px;
    margin: 0;
    transition: 200ms ease-in-out;

    &:hover:not([disabled]) {
        color: #000;
        border: 3px solid ${PRIMARY_COLOR};
        transition: 200ms ease-in-out;
    }

    &:disabled {
        color: ${SECONDARY_COLOR};
        background-color: #D9DCE1;
        border: 3px solid ${SECONDARY_COLOR};
        cursor: no-drop;
    }

    svg {
        width: 17px;
        height: 17px;
    }
`;

const ControlButton = ({ label, icon: Icon, onClick, disabled }) => {
    return (
        <Button
            type="button"
            onClick={onClick}
            style={{ fontSize: '14px' }}
            disabled={disabled}
        >
            {Icon && <Icon /> } {label}
        </Button>
    );
};

ControlButton.propTypes = {
    label: PropTypes.string,
    icon: PropTypes.func,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};


export default ControlButton;
