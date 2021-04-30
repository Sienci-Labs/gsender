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

/*
 *     This file is part of gSender.
 *
 *     gSender is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     gSender is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 */

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
