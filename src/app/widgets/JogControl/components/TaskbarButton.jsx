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

import styled from 'styled-components';

const TaskbarButton = styled.button`
    display: inline-block;
    margin: 4px;
    padding: 2px 5px;
    border: 0;
    font-weight: normal;
    line-height: 0;
    text-align: center;
    white-space: nowrap;
    touch-action: manipulation;
    cursor: pointer;
    background-image: none;
    background-color: inherit;

    opacity: 0.6;
    &:hover {
        opacity: .8;
    }

    &[disabled] {
        opacity: .3;
        cursor: not-allowed;
    }
    &[disabled]:hover {
        background-color: inherit;
    }

    &:hover {
        background-color: #e6e6e6;
        text-decoration: none;
    }

    &:focus,
    &:active {
        outline: 0;
    }
`;

export default TaskbarButton;
