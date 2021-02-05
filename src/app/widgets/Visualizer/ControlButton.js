import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { PRIMARY_COLOR, SECONDARY_COLOR, BORDER_COLOR } from './constants';

const Button = styled.button`
    border: 1px solid ${BORDER_COLOR};
    color: ${PRIMARY_COLOR};
    background-color: #D1D5DB;
    border-radius: 0.25rem;
    width: 85px;
    padding: 5px;
    margin: 0;
    transition: 200ms ease-in-out;
    margin-right:15px;

    &:hover:not([disabled]) {
        border: 1px solid ${PRIMARY_COLOR};
        transition: 200ms ease-in-out;
        background-color: #E5E7EB;
    }

    &:disabled {
        color: ${SECONDARY_COLOR};
        background-color: #D9DCE1;
        border: 1px solid ${SECONDARY_COLOR};
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
            {label} {Icon && Icon }
        </Button>
    );
};

ControlButton.propTypes = {
    label: PropTypes.string,
    icon: PropTypes.object,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};


export default ControlButton;
