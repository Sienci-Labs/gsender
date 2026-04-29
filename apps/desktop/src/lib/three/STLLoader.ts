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

/* eslint-disable */
/**
 * @author aleeper / http://adamleeper.com/
 * @author mrdoob / http://mrdoob.com/
 * @author gero3 / https://github.com/gero3
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Description: A THREE loader for STL ASCII files, as created by Solidworks and other CAD programs.
 *
 * Supports both binary and ASCII encoded files, with automatic detection of type.
 *
 * The loader returns a non-indexed buffer geometry.
 *
 * Limitations:
 *  Binary decoding supports "Magics" color format (http://en.wikipedia.org/wiki/STL_(file_format)#Color_in_binary_STL).
 *  There is perhaps some question as to how valid it is to always assume little-endian-ness.
 *  ASCII decoding assumes file is UTF-8.
 *
 * Usage:
 *  let loader = new THREE.STLLoader();
 *  loader.load( './models/stl/slotted_disk.stl', function ( geometry ) {
 *    scene.add( new THREE.Mesh( geometry ) );
 *  });
 *
 * For binary STLs geometry might contain colors for vertices. To use it:
 *  // use the same code to load STL as above
 *  if (geometry.hasColors) {
 *    material = new THREE.MeshPhongMaterial({ opacity: geometry.alpha, vertexColors: THREE.VertexColors });
 *  } else { .... }
 *  let mesh = new THREE.Mesh( geometry, material );
 */

import * as THREE from 'three';

class STLLoader {
    manager: THREE.LoadingManager;
    path: string;
    constructor(manager: THREE.LoadingManager) {
        this.manager =
            manager !== undefined ? manager : THREE.DefaultLoadingManager;
    }

    load(
        url: string,
        onLoad: Function,
        onProgress: (event: ProgressEvent) => void,
        onError: (err: unknown) => void,
    ): void {
        let scope = this;
        let loader = new THREE.FileLoader(scope.manager);
        loader.setPath(scope.path);
        loader.setResponseType('arraybuffer');
        loader.load(
            url,
            function (text) {
                try {
                    onLoad(scope.parse(text));
                } catch (exception) {
                    if (onError) {
                        onError(exception);
                    }
                }
            },
            onProgress,
            onError,
        );
    }

    setPath(value: string): STLLoader {
        this.path = value;
        return this;
    }

    parse(data: string | ArrayBuffer) {
        const isBinary = (data: ArrayBufferLike): boolean => {
            let expect: number,
                face_size: number,
                n_faces: number,
                reader: DataView;
            reader = new DataView(data);
            face_size = (32 / 8) * 3 + (32 / 8) * 3 * 3 + 16 / 8;
            n_faces = reader.getUint32(80, true);
            expect = 80 + 32 / 8 + n_faces * face_size;

            if (expect === reader.byteLength) {
                return true;
            }

            // An ASCII STL data must begin with 'solid ' as the first six bytes.
            // However, ASCII STLs lacking the SPACE after the 'd' are known to be
            // plentiful.  So, check the first 5 bytes for 'solid'.
            // Several encodings, such as UTF-8, precede the text with up to 5 bytes:
            // https://en.wikipedia.org/wiki/Byte_order_mark#Byte_order_marks_by_encoding
            // Search for "solid" to start anywhere after those prefixes.
            // US-ASCII ordinal values for 's', 'o', 'l', 'i', 'd'
            let solid = [115, 111, 108, 105, 100];

            for (let off = 0; off < 5; off++) {
                // If "solid" text is matched to the current offset, declare it to be an ASCII STL.
                if (matchDataViewAt(solid, reader, off)) return false;
            }

            // Couldn't find "solid" text at the beginning; it is binary STL.
            return true;
        };

        const matchDataViewAt = (
            query: Array<number>,
            reader: DataView,
            offset: number,
        ): boolean => {
            // Check if each byte in query matches the corresponding byte from the current offset
            for (let i = 0, il = query.length; i < il; i++) {
                if (query[i] !== reader.getUint8(offset + i)) return false;
            }
            return true;
        };

        const parseBinary = (data: ArrayBufferLike): THREE.BufferGeometry => {
            let reader = new DataView(data);
            let faces = reader.getUint32(80, true);

            let r: number;
            let g: number;
            let b: number;
            let hasColors = false;
            let colors: Array<number>;
            let defaultR: number;
            let defaultG: number;
            let defaultB: number;
            let alpha: number;

            // process STL header
            // check for default color in header ("COLOR=rgba" sequence).
            for (let index = 0; index < 80 - 10; index++) {
                if (
                    reader.getUint32(index, false) == 0x434f4c4f /*COLO*/ &&
                    reader.getUint8(index + 4) == 0x52 /*'R'*/ &&
                    reader.getUint8(index + 5) == 0x3d /*'='*/
                ) {
                    hasColors = true;
                    colors = [];

                    defaultR = reader.getUint8(index + 6) / 255;
                    defaultG = reader.getUint8(index + 7) / 255;
                    defaultB = reader.getUint8(index + 8) / 255;
                    alpha = reader.getUint8(index + 9) / 255;
                }
            }

            let dataOffset = 84;
            let faceLength = 12 * 4 + 2;

            let geometry = new THREE.BufferGeometry();

            let vertices = [];
            let normals = [];

            for (let face = 0; face < faces; face++) {
                let start = dataOffset + face * faceLength;
                let normalX = reader.getFloat32(start, true);
                let normalY = reader.getFloat32(start + 4, true);
                let normalZ = reader.getFloat32(start + 8, true);

                if (hasColors) {
                    let packedColor = reader.getUint16(start + 48, true);

                    if ((packedColor & 0x8000) === 0) {
                        // facet has its own unique color
                        r = (packedColor & 0x1f) / 31;
                        g = ((packedColor >> 5) & 0x1f) / 31;
                        b = ((packedColor >> 10) & 0x1f) / 31;
                    } else {
                        r = defaultR;
                        g = defaultG;
                        b = defaultB;
                    }
                }

                for (let i = 1; i <= 3; i++) {
                    let vertexstart = start + i * 12;

                    vertices.push(reader.getFloat32(vertexstart, true));
                    vertices.push(reader.getFloat32(vertexstart + 4, true));
                    vertices.push(reader.getFloat32(vertexstart + 8, true));

                    normals.push(normalX, normalY, normalZ);

                    if (hasColors) {
                        colors.push(r, g, b);
                    }
                }
            }

            geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(new Float32Array(vertices), 3),
            );
            geometry.setAttribute(
                'normal',
                new THREE.BufferAttribute(new Float32Array(normals), 3),
            );

            if (hasColors) {
                geometry.setAttribute(
                    'color',
                    new THREE.BufferAttribute(new Float32Array(colors), 3),
                );
                // geometry.hasColors = true;    // TODO: these dont exist?
                // geometry.alpha = alpha;
            }

            return geometry;
        };

        const parseASCII = (data: string): THREE.BufferGeometry => {
            let geometry = new THREE.BufferGeometry();
            let patternFace = /facet([\s\S]*?)endfacet/g;
            let faceCounter = 0;

            let patternFloat = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/
                .source;
            let patternVertex = new RegExp(
                'vertex' + patternFloat + patternFloat + patternFloat,
                'g',
            );
            let patternNormal = new RegExp(
                'normal' + patternFloat + patternFloat + patternFloat,
                'g',
            );

            let vertices: Array<number> = [];
            let normals: Array<number> = [];

            let normal = new THREE.Vector3();

            let result: RegExpExecArray | null;

            while ((result = patternFace.exec(data)) !== null) {
                let vertexCountPerFace = 0;
                let normalCountPerFace = 0;

                let text = result[0];

                while ((result = patternNormal.exec(text)) !== null) {
                    normal.x = parseFloat(result[1]);
                    normal.y = parseFloat(result[2]);
                    normal.z = parseFloat(result[3]);
                    normalCountPerFace++;
                }

                while ((result = patternVertex.exec(text)) !== null) {
                    vertices.push(
                        parseFloat(result[1]),
                        parseFloat(result[2]),
                        parseFloat(result[3]),
                    );
                    normals.push(normal.x, normal.y, normal.z);
                    vertexCountPerFace++;
                }

                // every face have to own ONE valid normal
                if (normalCountPerFace !== 1) {
                    console.error(
                        "STLLoader: Something isn't right with the normal of face number " +
                            faceCounter,
                    );
                }

                // each face have to own THREE valid vertices
                if (vertexCountPerFace !== 3) {
                    console.error(
                        "STLLoader: Something isn't right with the vertices of face number " +
                            faceCounter,
                    );
                }

                faceCounter++;
            }

            geometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(vertices, 3),
            );
            geometry.setAttribute(
                'normal',
                new THREE.Float32BufferAttribute(normals, 3),
            );

            return geometry;
        };

        const ensureString = (buffer: string | ArrayBufferLike): string => {
            if (typeof buffer !== 'string') {
                return THREE.LoaderUtils.decodeText(new Uint8Array(buffer));
            }
            return buffer;
        };

        const ensureBinary = (
            buffer: string | ArrayBuffer,
        ): ArrayBufferLike | Uint8Array => {
            if (typeof buffer === 'string') {
                let array_buffer = new Uint8Array(buffer.length);
                for (let i = 0; i < buffer.length; i++) {
                    array_buffer[i] = buffer.charCodeAt(i) & 0xff; // implicitly assumes little-endian
                }
                return array_buffer.buffer || array_buffer;
            } else {
                return buffer;
            }
        };

        // start
        let binData = ensureBinary(data);

        return isBinary(binData)
            ? parseBinary(binData)
            : parseASCII(ensureString(data));
    }
}

export default STLLoader;
