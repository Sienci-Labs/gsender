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
import { ReactElement } from 'react';
import i18n from './i18n';

export interface ValidationProps {
    type: string;
    name: string;
    checked: boolean;
}

export interface ValidationComponent {
    blurred: boolean;
    changed: boolean;
    value: string;
}

export interface ValidationComponents {
    password: Array<ValidationComponent>;
    confirm: Array<ValidationComponent>;
}

export interface RequiredComponent {
    [key: string]: Array<{ checked: boolean; props: ValidationProps }>;
}

const Error = (props: any): ReactElement => (
    <div {...props} style={{ color: '#A94442' }} />
);

const required = (
    value: string,
    props: ValidationProps,
    components: RequiredComponent,
): ReactElement => {
    if (props.type === 'radio') {
        const name = props.name;

        const component = (components[name] as Array<any>) || [];
        if (component.length === 0) {
            return null;
        }

        // Controls the placement of the error message for radio buttons
        if (component[component.length - 1] !== props) {
            return null;
        }

        const checked = component.reduce(
            (checked: boolean, props: ValidationProps) => {
                return checked || props.checked;
            },
            false,
        );

        if (checked) {
            return null;
        }

        return <Error>{i18n._('This field is required.')}</Error>;
    }

    if (props.type === 'checkbox') {
        if (props.checked) {
            return null;
        }

        return <Error>{i18n._('This field is required.')}</Error>;
    }

    value = ('' + value).trim();
    if (!value) {
        return <Error>{i18n._('This field is required.')}</Error>;
    }

    return null;
};

const password = (
    _value: string,
    _props: ValidationProps,
    components: ValidationComponents,
): ReactElement => {
    const bothBlurred =
        components.password[0].blurred && components.confirm[0].blurred;
    const bothChanged =
        components.password[0].changed && components.confirm[0].changed;

    if (
        bothBlurred &&
        bothChanged &&
        components.password[0].value !== components.confirm[0].value
    ) {
        return <Error>{i18n._('Passwords should be equal.')}</Error>;
    }

    return null;
};

export { required, password };
