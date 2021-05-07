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

/* eslint react/prop-types: 0 */
import React from 'react';
import i18n from './i18n';

const Error = (props) => (
    <div {...props} style={{ color: '#A94442' }} />
);

const required = (value, props, components) => {
    if (props.type === 'radio') {
        const name = props.name;

        components = components[name] || [];
        if (components.length === 0) {
            return null;
        }

        // Controls the placement of the error message for radio buttons
        if (components[components.length - 1] !== props) {
            return null;
        }

        const checked = components.reduce((checked, props) => {
            return checked || props.checked;
        }, false);

        if (checked) {
            return null;
        }

        return (
            <Error>{i18n._('This field is required.')}</Error>
        );
    }

    if (props.type === 'checkbox') {
        if (props.checked) {
            return null;
        }

        return (
            <Error>{i18n._('This field is required.')}</Error>
        );
    }

    value = ('' + value).trim();
    if (!value) {
        return (
            <Error>{i18n._('This field is required.')}</Error>
        );
    }

    return null;
};

const password = (value, props, components) => {
    const bothBlurred = components.password[0].blurred && components.confirm[0].blurred;
    const bothChanged = components.password[0].changed && components.confirm[0].changed;

    if (bothBlurred && bothChanged && components.password[0].value !== components.confirm[0].value) {
        return (
            <Error>{i18n._('Passwords should be equal.')}</Error>
        );
    }

    return null;
};

export {
    required,
    password
};
