/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

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
