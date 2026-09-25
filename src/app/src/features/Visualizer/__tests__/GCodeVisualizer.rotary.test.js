import * as THREE from 'three';
import GCodeVisualizer from '../GCodeVisualizer';

jest.mock('app/store/redux', () => ({ store: { getState: () => ({}) } }));
jest.mock('app/lib/rotary', () => ({ checkIfRotaryFile: () => true }));

test.each(['X', 'Y'])(
    'live %s rotation reverses the worker transform',
    (rotaryPreviewAxis) => {
        const visualizer = new GCodeVisualizer(new Map());
        const point = rotaryPreviewAxis === 'Y' ? [-5, 20, 0] : [20, 5, 0];
        visualizer.render(
            {
                vertices: new Float32Array(point),
                frames: [1],
                rotaryPreviewAxis,
            },
            new Float32Array([1, 1, 1, 1]),
        );
        const rotation = visualizer.getRotaryRotation(90);
        const restored = new THREE.Vector3(...point).applyEuler(
            new THREE.Euler(rotation.x, rotation.y, rotation.z),
        );
        const expected = rotaryPreviewAxis === 'Y' ? [0, 20, 5] : [20, 0, 5];
        restored
            .toArray()
            .forEach((value, i) => expect(value).toBeCloseTo(expected[i], 8));
        visualizer.unload();
    },
);

test('legacy geometry defaults to X and reloading clears the previous rotation axis', () => {
    const visualizer = new GCodeVisualizer(new Map());
    const geometry = { vertices: new Float32Array([0, 0, 5]), frames: [1] };
    const colors = new Float32Array([1, 1, 1, 1]);
    visualizer.render({ ...geometry, rotaryPreviewAxis: 'Y' }, colors);
    expect(visualizer.getRotaryRotation(180)).toEqual({
        x: 0,
        y: Math.PI,
        z: 0,
    });
    visualizer.unload();
    visualizer.render(geometry, colors);
    expect(visualizer.getRotaryRotation(180)).toEqual({
        x: Math.PI,
        y: 0,
        z: 0,
    });
    visualizer.unload();
});

test('offline previews use zero rotation and a top-of-stock zero keeps the physical pivot', () => {
    const visualizer = new GCodeVisualizer(new Map());
    visualizer.render(
        {
            // Work (X0,Y20,Z-2), centerline Z-10, at A90 -> local (-8,20,0).
            vertices: new Float32Array([-8, 20, 0]),
            frames: [1],
            rotaryPreviewAxis: 'Y',
            rotaryCenterlineZ: -10,
        },
        new Float32Array([1, 1, 1, 1]),
    );
    expect(visualizer.getRotaryRotation()).toEqual({ x: 0, y: 0, z: 0 });
    const rotation = visualizer.getRotaryRotation(90);
    visualizer.group.rotation.set(rotation.x, rotation.y, rotation.z);
    visualizer.group.updateMatrixWorld();
    const restored = visualizer.group.localToWorld(
        new THREE.Vector3(-8, 20, 0),
    );
    restored
        .toArray()
        .forEach((value, i) => expect(value).toBeCloseTo([0, 20, -2][i], 8));
    visualizer.unload();
});
