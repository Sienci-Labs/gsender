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

/**
 * errnotfound:
 *
 * Examples:
 *
 *     app.use(middleware.errnotfound({ view: '404', error: 'Not found' }))
 *
 * Options:
 *
 *   - view     view
 *   - error    error message
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

const errnotfound = (options) => {
    options = options || {};

    let view = options.view || '404',
        error = options.error || '';

    return (req, res, next) => {
        res.status(404);

        // respond with html page
        if (req.accepts('html')) {
            res.render(view, { url: req.url });
            return;
        }

        // respond with json
        if (req.accepts('json')) {
            res.send({ error: error });
            return;
        }

        // default to plain-text. send()
        res.type('txt').send(error);
    };
};

module.exports = errnotfound;
