/*
 * Copyright (C) 2022 Sienci Labs Inc.
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
import path from 'path';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';

const NODE_ENV = process.env.NODE_ENV || 'development';

export default {
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
        }),
        babel({
            exclude: 'node_modules/**'
        }),
        resolve(),
        commonjs()
    ],
    input: path.resolve(__dirname, 'src/app/index.jsx'),
    output: [
        {
            file: path.resolve(__dirname, 'output/gSender/bundle.js')
        }
    ]
};
