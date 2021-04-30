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

import omit from 'lodash/omit';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import i18n from 'app/lib/i18n';

const REGEXP = /{{(.+?)}}/;

class I18n extends Component {
    static propTypes = {
        t: PropTypes.string,
        _: PropTypes.string,
        options: PropTypes.object,
        parent: PropTypes.string,
        replacement: PropTypes.oneOfType([
            PropTypes.array,
            PropTypes.object
        ])
    };

    static defaultProps = {
        t: '',
        _: '',
        parent: 'span'
    };

    render() {
        const { t, _, parent, replacement } = this.props;
        const i18nOptions = {
            ...this.props.options,
            ...{
                interpolation: {
                    prefix: '#$?',
                    suffix: '?$#'
                }
            }
        };
        let format = null;
        if (this.props.children) {
            format = this.props.children;
        } else if (t) {
            format = i18n.t(t, i18nOptions);
        } else if (_) {
            format = i18n._(_, i18nOptions);
        }
        if (!format || typeof format !== 'string') {
            return React.createElement('noscript', null);
        }

        let props = omit(this.props, ['t', '_', 'options', 'parent', 'replacement']);
        let matches = [];
        let children = [];

        // "AAA {{foo}} BBB {{bar}}".split(REGEXP)
        // ["AAA ", "foo", " BBB ", "bar", ""]
        format.split(REGEXP).reduce((memo, match, index) => {
            let child = null;

            if (index % 2 === 0) {
                if (match.length === 0) {
                    return memo;
                }
                child = match;
            } else if (replacement) {
                child = replacement[match];
            } else {
                child = this.props[match];
                matches.push(match);
            }

            memo.push(child);

            return memo;
        }, children);

        props = omit(props, matches);

        return React.createElement.apply(this, [parent, props].concat(children));
    }
}

export default I18n;
