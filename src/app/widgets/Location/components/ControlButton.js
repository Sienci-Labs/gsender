import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { PRIMARY_COLOR, SECONDARY_COLOR, BORDER_COLOR } from '../constants';

const Button = styled.button`
    border: 1px solid ${BORDER_COLOR};
    color: ${props => (props.isMovement ? '#FFFFFF' : PRIMARY_COLOR)};
    background-color: ${props => (props.isMovement ? PRIMARY_COLOR : '#D1D5DB')};
    border-radius: 0.25rem;
    width: 100%;
    max-width: 8rem;
    padding: 5px;
    margin: 0;
    --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
  ${props => (props.isHidden && `
    display: none;
  `)}


    transition: 200ms ease-in-out;

    &:hover:not([disabled]) {
        border: 1px solid ${PRIMARY_COLOR};
        transition: 200ms ease-in-out;
        background-color: ${props => (props.isMovement ? '#77a9d7' : '#E5E7EB')};
    }

    &:disabled {
        color: ${SECONDARY_COLOR};
        background-color: #D9DCE1;
        border: 1px solid ${SECONDARY_COLOR};
        cursor: no-drop;
    }

    &:first-child {
        margin-top: 0 !important;
    }

    svg {
        width: 17px;
        height: 17px;
    }
`;

const ControlButton = ({ label, icon: Icon, onClick, disabled, isMovement = false, isHidden = false }) => {
    return (
        <Button
            type="button"
            onClick={onClick}//STYLE HERE FOR LOCATION BUTTONS IN BUILD VERSION
            style={{ fontSize: '14px', marginBottom: '0px', marginRight: '10px', marginTop: '10px' }}
            disabled={disabled}
            isMovement={isMovement}
            isHidden={isHidden}
        >
            {Icon && <Icon isMovement={isMovement} /> } {label}
        </Button>
    );
};

ControlButton.propTypes = {
    label: PropTypes.string,
    icon: PropTypes.func,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    isMovement: PropTypes.bool
};


export default ControlButton;
