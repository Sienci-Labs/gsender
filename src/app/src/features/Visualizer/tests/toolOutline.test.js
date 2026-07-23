/*
 * Unit tests for createToolOutline (the cutting-tool flute outline added in
 * "Outline the cutting tool's flutes so rotation is visible").
 *
 * The outline builder is a pure THREE helper: given the tool mesh geometry it
 * returns a black LineSegments of the geometry's sharp edges (so the spinning
 * bit reads as a fluted tool rather than a featureless grey blob), or null for
 * unusable input. three is real (not mocked).
 */

import * as THREE from 'three';
import { createToolOutline } from '../helpers';

describe('createToolOutline', () => {
    describe('guards against unusable geometry', () => {
        it('returns null when geometry is missing', () => {
            expect(createToolOutline(undefined)).toBeNull();
            expect(createToolOutline(null)).toBeNull();
        });

        it('returns null when the object has no getAttribute', () => {
            expect(createToolOutline({})).toBeNull();
        });

        it('returns null when there is no position attribute', () => {
            // A geometry with getAttribute but no 'position' (e.g. empty).
            expect(createToolOutline(new THREE.BufferGeometry())).toBeNull();
        });
    });

    describe('builds the outline for a valid mesh geometry', () => {
        it('returns a named black LineSegments of edges', () => {
            const outline = createToolOutline(new THREE.BoxGeometry(1, 1, 1));

            expect(outline).toBeInstanceOf(THREE.LineSegments);
            expect(outline.geometry).toBeInstanceOf(THREE.EdgesGeometry);
            expect(outline.name).toBe('CuttingToolOutline');
            // Black material so the edges read as a dark outline.
            expect(outline.material).toBeInstanceOf(THREE.LineBasicMaterial);
            expect(outline.material.color.getHex()).toBe(0x000000);
            // A cube has its 12 right-angle edges kept (12 edges * 2 vertices).
            expect(
                outline.geometry.getAttribute('position').count,
            ).toBeGreaterThan(0);
        });

        it('honors thresholdAngleDeg — a higher threshold keeps fewer edges', () => {
            const box = new THREE.BoxGeometry(1, 1, 1);
            const def = createToolOutline(box); // default 30deg
            // The cube's faces meet at 90deg; a 100deg threshold keeps no edges.
            const sparse = createToolOutline(box, { thresholdAngleDeg: 100 });

            const defCount = def.geometry.getAttribute('position').count;
            const sparseCount = sparse.geometry.getAttribute('position').count;
            expect(defCount).toBeGreaterThan(sparseCount);
        });
    });
});
