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

import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import logger from './lib/logger';

const log = logger('webpack-dev-server');

const webpackDevServer = (app) => {
    if (process.env.NODE_ENV !== 'development') {
        log.error('The process.env.NODE_ENV should be "development" while running a webpack server');
        return;
    }

    const webpackConfig = require('../../webpack.config.app.development');
    const compiler = webpack(webpackConfig);

    // https://github.com/webpack/webpack-dev-middleware
    // webpack-dev-middleware handle the files in memory.
    app.use(webpackDevMiddleware(compiler, {
        lazy: false,
        // https://webpack.github.io/docs/node.js-api.html#compiler
        watchOptions: {
            poll: true, // use polling instead of native watchers
            ignored: /node_modules/
        },
        publicPath: webpackConfig.output.publicPath,
        stats: {
            colors: true
        }
    }));

    app.use(webpackHotMiddleware(compiler, {
        path: '/__webpack_hmr',
        heartbeat: 10 * 1000
    }));
};

export default webpackDevServer;
