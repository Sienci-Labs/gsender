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
 * errserver:
 *
 * error-handling middleware, take the same form
 * as regular middleware, however they require an
 * arity of 4, aka the signature (err, req, res, next).
 * when connect has an error, it will invoke ONLY error-handling
 * middleware.
 *
 * If we were to next() here any remaining non-error-handling
 * middleware would then be executed, or if we next(err) to
 * continue passing the error, only error-handling middleware
 * would remain being executed, however here
 * we simply respond with an error page.
 *
 * Examples:
 *
 *     app.use(middleware.errserver({ view: '500', error: 'Internal server error' }))
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

const errserver = (options) => {
    options = options || {};

    let view = options.view || '500',
        error = options.error || '';

    return (err, req, res, next) => {
        // we may use properties of the error object
        // here and next(err) appropriately, or if
        // we possibly recovered from the error, simply next().
        res.status(err.status || 500);
        res.render(view, { error: error });
    };
};

module.exports = errserver;
