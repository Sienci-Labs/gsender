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

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styles from './index.styl';

class Widget extends PureComponent {
    static propTypes = {
        borderless: PropTypes.bool,
        fullscreen: PropTypes.bool
    };

    static defaultProps = {
        borderless: false,
        fullscreen: false
    };

    render() {
        const { borderless, fullscreen, className, ...props } = this.props;

        return (
            <div
                {...props}
                className={classNames(
                    className,
                    styles.widget,
                    { [styles.widgetBorderless]: borderless },
                    { [styles.widgetFullscreen]: fullscreen }
                )}
            />
        );
    }
}

export default Widget;
