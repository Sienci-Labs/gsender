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
import ReactDOM from 'react-dom';

export default (Component, node = null) => new Promise((resolve, reject) => {
    let defaultNode = null;

    if (!node) {
        defaultNode = document.createElement('div');
        defaultNode.setAttribute('data-portal', '');
        document && document.body && document.body.appendChild(defaultNode);
    }

    ReactDOM.render(
        <Component
            onClose={() => {
                setTimeout(() => {
                    if (node) {
                        ReactDOM.unmountComponentAtNode(node);
                    } else if (defaultNode) {
                        ReactDOM.unmountComponentAtNode(defaultNode);
                        document && document.body && document.body.removeChild(defaultNode);
                        defaultNode = null;
                    }

                    resolve();
                }, 0);
            }}
        />,
        node || defaultNode
    );
});
