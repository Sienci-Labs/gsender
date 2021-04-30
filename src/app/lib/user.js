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

import api from 'app/api';
import config from 'app/store';

let _authenticated = false;

export const signin = ({ token, name, password }) => new Promise((resolve, reject) => {
    api.signin({ token, name, password })
        .then((res) => {
            const { enabled = false, token = '', name = '' } = { ...res.body };

            config.set('session.enabled', enabled);
            config.set('session.token', token);
            config.set('session.name', name);

            // Persist data after successful login to prevent debounced update
            config.persist();

            _authenticated = true;
            resolve({ authenticated: true, token: token });
        })
        .catch((res) => {
            // Do not unset session token so it won't trigger an update to the store
            _authenticated = false;
            resolve({ authenticated: false, token: null });
        });
});

export const signout = () => new Promise((resolve, reject) => {
    config.unset('session.token');
    _authenticated = false;
    resolve();
});

export const isAuthenticated = () => {
    return _authenticated;
};
