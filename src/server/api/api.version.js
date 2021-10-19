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

import url from 'url';
import registryUrl from 'registry-url';
import registryAuthToken from 'registry-auth-token';
import request from 'superagent';
import {
    ERR_INTERNAL_SERVER_ERROR
} from '../constants';

const pkgName = 'gsender';

export const getLatestVersion = (req, res) => {
    const scope = pkgName.split('/')[0];
    const regUrl = registryUrl(scope);
    const pkgUrl = url.resolve(regUrl, encodeURIComponent(pkgName).replace(/^%40/, '@'));
    const authInfo = registryAuthToken(regUrl);
    const headers = {};

    if (authInfo) {
        headers.Authorization = `${authInfo.type} ${authInfo.token}`;
    }

    request
        .get(pkgUrl)
        .set(headers)
        .end((err, _res) => {
            if (err) {
                res.status(ERR_INTERNAL_SERVER_ERROR).send({
                    msg: `Failed to connect to ${pkgUrl}: code=${err.code}`
                });
                return;
            }

            const { body: data = {} } = { ..._res };
            data.time = data.time || {};
            data['dist-tags'] = data['dist-tags'] || {};
            data.versions = data.versions || {};

            const time = data.time[latest];
            const latest = data['dist-tags'].latest;
            const {
                name,
                version,
                description,
                homepage
            } = { ...data.versions[latest] };

            res.send({ time, name, version, description, homepage });
        });
};
