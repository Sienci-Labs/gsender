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

import memoize from 'memoize-one';

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

// Memoize the result to mitigate the issue of WebGL context lost and restored
export const isWebGLAvailable: () => boolean = memoize(() => {
    try {
        let canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
});

// Memoize the result to mitigate the issue of WebGL context lost and restored
export const isWebGL2Available: () => boolean = memoize(() => {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch (e) {
        return false;
    }
});

export const getWebGLErrorMessage = (): HTMLDivElement => {
    return getErrorMessage(1);
};

export const getWebGL2ErrorMessage = (): HTMLDivElement => {
    return getErrorMessage(2);
};

export const getErrorMessage = (version: number): HTMLDivElement => {
    const names = {
        1: 'WebGL',
        2: 'WebGL 2',
    };

    const contexts = {
        1: window.WebGLRenderingContext,
        2: window.WebGL2RenderingContext,
    };

    let message =
        'Your $0 does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">$1</a>';

    const element = document.createElement('div');
    element.id = 'webglmessage';
    element.style.fontFamily = 'monospace';
    element.style.fontSize = '14px';
    element.style.fontWeight = 'normal';
    element.style.textAlign = 'center';
    element.style.background = '#fff';
    element.style.color = '#000';
    element.style.padding = '1.5em';
    element.style.width = '400px';
    element.style.margin = '5em auto 0';

    if (contexts[version as keyof typeof contexts]) {
        message = message.replace('$0', 'graphics card');
    } else {
        message = message.replace('$0', 'browser');
    }

    message = message.replace('$1', names[version as keyof typeof names]);
    element.innerHTML = message;

    return element;
};
