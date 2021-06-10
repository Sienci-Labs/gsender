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

import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Container, Row, Col } from 'app/components/GridSystem';
import { Button } from 'app/components/Buttons';
import controller from 'app/lib/controller';

class MDI extends PureComponent {
    static propTypes = {
        canClick: PropTypes.bool,
        mdi: PropTypes.shape({
            disabled: PropTypes.bool,
            commands: PropTypes.array
        })
    };

    renderMDIButtons() {
        const { canClick, mdi } = this.props;

        return mdi.commands.map(c => {
            const grid = Object.keys(c.grid || {})
                .filter(size => ['xs', 'sm', 'md', 'lg', 'xl'].indexOf(size) >= 0)
                .reduce((acc, size) => {
                    if (c.grid[size] >= 1 && c.grid[size] <= 12) {
                        acc[size] = Math.floor(c.grid[size]);
                    }
                    return acc;
                }, {});

            return (
                <Col {...grid} key={c.id} style={{ padding: '0 4px', marginTop: 5 }}>
                    <Button
                        btnSize="sm"
                        btnStyle="flat"
                        style={{
                            minWidth: 'auto',
                            width: '100%'
                        }}
                        disabled={!canClick}
                        onClick={() => {
                            controller.command('gcode', c.command);
                        }}
                    >
                        {c.name}
                    </Button>
                </Col>
            );
        });
    }

    render() {
        const { mdi } = this.props;

        if (mdi.disabled || mdi.commands.length === 0) {
            return null;
        }

        return (
            <Container fluid style={{ padding: 0, margin: '-5px -4px 0 -4px' }}>
                <Row gutterWidth={0}>
                    {this.renderMDIButtons()}
                </Row>
            </Container>
        );
    }
}

export default MDI;
