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
import React, { PureComponent } from 'react';
import Toggle from 'react-toggle';
import i18n from 'app/lib/i18n';

class WidgetListItem extends PureComponent {
    static propTypes = {
        id: PropTypes.string,
        caption: PropTypes.string,
        details: PropTypes.string,
        checked: PropTypes.bool,
        disabled: PropTypes.bool,
        onChange: PropTypes.func
    };

    state = {
        checked: this.props.checked
    };

    handleChange = (event) => {
        const checked = event.target.checked;
        this.setState({ checked: checked });
        this.props.onChange(this.props.id, checked);
    };

    render() {
        const { checked } = this.state;
        const styles = {
            thumbnail: {
                fontSize: 100,
                backgroundColor: '#f5f6f7',
                color: checked ? 'rgba(64, 64, 64, 0.8)' : '#ccc',
                textShadow: '2px 2px 2px #a0a0a0'
            },
            caption: {
                color: '#333',
                fontWeight: 'bold',
                opacity: checked ? 1 : 0.6
            },
            details: {
                color: '#333',
                height: 60,
                marginTop: 15,
                maxHeight: 60,
                opacity: checked ? 1 : 0.6
            }
        };

        return (
            <div className="panel panel-default">
                <div className="panel-head text-center" style={styles.thumbnail}>
                    <i className="fa fa-list-alt" style={{ fontSize: 'inherit' }} />
                </div>
                <div className="panel-body">
                    <div className="row no-gutters">
                        <div className="col-sm-8 text-left">
                            <span style={styles.caption}>{this.props.caption}</span>
                        </div>
                        <div className="col-sm-4 text-right">
                            <span
                                title={checked ? i18n._('On') : i18n._('Off')}
                            >
                                <Toggle
                                    disabled={this.props.disabled}
                                    defaultChecked={checked}
                                    onChange={this.handleChange}
                                />
                            </span>
                        </div>
                    </div>
                    <div style={styles.details}>
                        <p>{this.props.details}</p>
                    </div>
                </div>
            </div>
        );
    }
}

export default WidgetListItem;
