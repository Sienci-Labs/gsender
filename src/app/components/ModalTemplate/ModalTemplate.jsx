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

import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import { FlexContainer, Row, Col } from '../GridSystem';
import iconError from './icon-error-48.png';
import iconWarning from './icon-warning-48.png';
import iconInfo from './icon-info-48.png';
import iconSuccess from './icon-success-48.png';

const Icon = styled.i`
    vertical-align: top;
    display: inline-block;
    width: 48px;
    height: 48px;
    background-repeat: no-repeat;
`;

const Error = styled(Icon)`
    background-image: url(${iconError});
`;

const Warning = styled(Icon)`
    background-image: url(${iconWarning});
`;

const Info = styled(Icon)`
    background-image: url(${iconInfo});
`;

const Success = styled(Icon)`
    background-image: url(${iconSuccess});
`;

const ModalTemplate = ({ type, children, templateStyle }) => (
    <FlexContainer>
        <Row>
            <Col width="auto">
                {type === 'error' && <Error />}
                {type === 'warning' && <Warning />}
                {type === 'info' && <Info />}
                {type === 'success' && <Success />}
            </Col>
            <Col style={templateStyle}>
                {children}
            </Col>
        </Row>
    </FlexContainer>
);

ModalTemplate.propTypes = {
    type: PropTypes.oneOf([
        'error',
        'warning',
        'info',
        'success'
    ]),
    templateStyle: PropTypes.object,
};

export default ModalTemplate;
