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

/* eslint import/no-dynamic-require: 0 */
import chainedFunction from 'chained-function';
import moment from 'moment';
import pubsub from 'pubsub-js';
import qs from 'qs';
import React from 'react';
import reduxStore from 'app/store/redux';
import { createRoot } from 'react-dom/client';
import {
    HashRouter as Router,
    Route,
    Switch
} from 'react-router-dom';
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import XHR from 'i18next-xhr-backend';
import { TRACE, DEBUG, INFO, WARN, ERROR } from 'universal-logger';
import { Provider as ReduxProvider } from 'react-redux';
import * as Sentry from '@sentry/react';

import { Provider as GridSystemProvider } from 'app/components/GridSystem';
import rootSaga from 'app/sagas';
import sagaMiddleware from 'app/store/redux/saga';

import settings from './config/settings';
import portal from './lib/portal';
import controller from './lib/controller';
import i18n from './lib/i18n';
import log from './lib/log';
import series from './lib/promise-series';
import promisify from './lib/promisify';
import * as user from './lib/user';
import store from './store';
import defaultState from './store/defaultState';
import App from './containers/App';
import Anchor from './components/Anchor';
import { Button } from './components/Buttons';
import ModalTemplate from './components/ModalTemplate';
import Modal from './components/Modal';
import Space from './components/Space';
import PopUpWidget from './containers/PopUpWidget';
import pkg from '../package.json';

import './styles/vendor.styl';
import './styles/app.styl';

if (process.env.NODE_ENV === 'production') {
    Sentry.init({
        dsn: 'https://c09ff263997c4a47ba22b3c948f19734@o558751.ingest.sentry.io/5692684',
        integrations: [
            new Sentry.BrowserTracing(),
            new Sentry.Replay()
        ],
        release: pkg.version
    });
}

const renderPage = () => {
    const container = document.createElement('div');
    document.title = `gSender ${settings.version}`;
    container.style.width = '100%';
    document.body.appendChild(container);
    const root = createRoot(container);

    sagaMiddleware.run(rootSaga);

    root.render(
        <ReduxProvider store={reduxStore}>
            <GridSystemProvider
                breakpoints={[576, 768, 992, 1200]}
                containerWidths={[540, 720, 960, 1140]}
                columns={12}
                gutterWidth={0}
                layout="floats"
            >
                <Router>
                    <Switch>
                        <Route path="/widget/:id" component={PopUpWidget} />
                        <Route path="/" component={App} />
                    </Switch>
                </Router>
            </GridSystemProvider>
        </ReduxProvider>
    );
};

series([
    () => {
        const obj = qs.parse(window.location.search.slice(1));
        const level = {
            trace: TRACE,
            debug: DEBUG,
            info: INFO,
            warn: WARN,
            error: ERROR
        }[obj.log_level || settings.log.level];
        log.setLevel(level);
    },
    () => promisify(next => {
        i18next
            .use(XHR)
            .use(LanguageDetector)
            .init(settings.i18next, (t) => {
                next();
            });
    })(),
    () => promisify(next => {
        const locale = i18next.language;
        if (locale === 'en') {
            next();
            return;
        }

        require('bundle-loader!moment/locale/' + locale)(() => {
            log.debug(`moment: locale=${locale}`);
            moment().locale(locale);
            next();
        });
    })(),
    () => promisify(next => {
        const token = store.get('session.token');
        user.signin({ token: token })
            .then(({ authenticated, token }) => {
                if (authenticated) {
                    log.debug('Create and establish a WebSocket connection');

                    const host = '';
                    const options = {
                        query: 'token=' + token
                    };
                    controller.connect(host, options, () => {
                        // @see "src/web/containers/Login/Login.jsx"
                        next();
                    });
                    return;
                }
                next();
            });
    })()
]).then(async () => {
    log.info(`${settings.productName} ${settings.version}`);
    // Cross-origin communication
    window.addEventListener('message', (event) => {
        // TODO: event.origin

        const { token = '', action } = { ...event.data };

        // Token authentication
        if (token !== store.get('session.token')) {
            log.warn(`Received a message with an unauthorized token (${token}).`);
            return;
        }

        const { type, payload } = { ...action };
        if (type === 'connect') {
            pubsub.publish('message:connect', payload);
        } else if (type === 'resize') {
            pubsub.publish('message:resize', payload);
        } else {
            log.warn(`No valid action type (${type}) specified in the message.`);
        }
    }, false);

    { // Prevent browser from loading a drag-and-dropped file
        // @see http://stackoverflow.com/questions/6756583/prevent-browser-from-loading-a-drag-and-dropped-file
        window.addEventListener('dragover', (e) => {
            e.preventDefault();
        }, false);

        window.addEventListener('drop', (e) => {
            e.preventDefault();
        }, false);
    }

    { // Hide loading
        const loading = document.getElementById('loading');
        loading && loading.remove();
    }

    { // Change backgrond color after loading complete
        const body = document.querySelector('body');
        body.style.backgroundColor = '#000000'; // sidebar background color
    }

    if (settings.error.corruptedWorkspaceSettings) {
        const text = await store.getConfig();
        const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
        const filename = `${settings.name}-${settings.version}.json`;

        await portal(({ onClose }) => (
            <Modal
                onClose={onClose}
                disableOverlayClick
                showCloseButton={false}
            >
                <Modal.Body>
                    <ModalTemplate type="error">
                        <h5>{i18n._('Corrupted workspace settings')}</h5>
                        <p>{i18n._('The workspace settings have become corrupted or invalid. Click Restore Defaults to restore default settings and continue.')}</p>
                        <div>
                            <Anchor
                                href={url}
                                download={filename}
                            >
                                <i className="fa fa-download" />
                                <Space width="4" />
                                {i18n._('Download workspace settings')}
                            </Anchor>
                        </div>
                    </ModalTemplate>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        btnStyle="danger"
                        onClick={chainedFunction(
                            () => {
                                // Reset to default state
                                store.state = defaultState;

                                // Persist data locally
                                store.persist();
                            },
                            onClose
                        )}
                    >
                        {i18n._('Restore Defaults')}
                    </Button>
                </Modal.Footer>
            </Modal>
        ));
    }

    renderPage();
}).catch(err => {
    log.error(err);
});
