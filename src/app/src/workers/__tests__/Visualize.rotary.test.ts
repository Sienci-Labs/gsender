import '../Visualize.worker';

// Exercise the real parser and worker; only the browser message transport is mocked.
const post = jest.spyOn(globalThis, 'postMessage').mockImplementation(() => {});

function visualize(content: string, options: Record<string, unknown> = {}) {
    post.mockClear();
    self.onmessage!({
        data: {
            content,
            rotaryDiameterOffsetEnabled: false,
            theme: new Map(),
            ...options,
        },
    } as MessageEvent);
    const result = post.mock.calls
        .map(([message]) => message)
        .find((message) => message.type === 'geometryReady');
    expect(result).toBeDefined();
    return {
        ...result,
        vertices: Array.from(new Float32Array(result.vertices)),
        frames: Array.from(new Uint32Array(result.frames)),
    };
}

function expectPoint(actual: number[], expected: number[]) {
    expected.forEach((value, i) => expect(actual[i]).toBeCloseTo(value, 5));
}

describe('A-axis rotary preview alignment', () => {
    test.each([0, 90, 180, 270])(
        'indexed surface-zero paths use the explicit centerline at A=%s',
        (a) => {
            const result = visualize(
                `(Cylinder Dia: 100)\nG21 G90\nG0 X3 Y10 Z-2 A${a}\nG1 Y20`,
                {
                    rotaryPreviewAxis: 'Y',
                    rotaryCenterlineZ: -10,
                    rotaryDiameterOffsetEnabled: true,
                },
            );
            const angle = (a * Math.PI) / 180;
            expectPoint(result.vertices.slice(-3), [
                3 * Math.cos(angle) - 8 * Math.sin(angle),
                20,
                8 * Math.cos(angle) + 3 * Math.sin(angle),
            ]);
            expect(result.rotaryCenterlineZ).toBe(-10);
        },
    );

    test('centerline is metric for inch input and does not affect non-rotary files', () => {
        const options = { rotaryPreviewAxis: 'Y', rotaryCenterlineZ: -25.4 };
        const result = visualize('G20 G90\nG0 X0 Y1 Z-0.5 A90', options);
        expectPoint(result.vertices.slice(-3), [-12.7, 25.4, 0]);
        const code = '(A90)\nG21 G90\nG0 X3 Y4 Z5\nG2 X5 Y4 I1 J0 ; A90';
        expect(visualize(code, options).vertices).toEqual(
            visualize(code).vertices,
        );
        expect(visualize(code, options).rotaryCenterlineZ).toBe(0);
    });

    test.each([90, -90, 180, 360, 720])(
        'Y centerline preserves axial travel at A=%s',
        (a) => {
            const result = visualize(
                `G21 G90\nG0 X0 Y10 Z5 A0\nG1 Y30 A${a} F600`,
                {
                    rotaryPreviewAxis: 'Y',
                },
            );
            const segmentCount = Math.ceil(Math.abs(a) / 5);
            // Skip the initial positioning move. Every tessellated endpoint must
            // remain on the radius-5 cylinder around Y, not the radius-30 X circle.
            const points = result.vertices.slice(6);
            expect(points).toHaveLength(segmentCount * 6);
            for (let i = 0; i < segmentCount; i++) {
                for (let endpoint = 0; endpoint < 2; endpoint++) {
                    const t = (i + endpoint) / segmentCount;
                    const angle = (a * t * Math.PI) / 180;
                    expectPoint(points.slice(i * 6 + endpoint * 3), [
                        -5 * Math.sin(angle),
                        10 + 20 * t,
                        5 * Math.cos(angle),
                    ]);
                }
            }
            expect(result.rotaryPreviewAxis).toBe('Y');
            expect(new Float32Array(result.colorArrayBuffer)).toHaveLength(
                (result.vertices.length / 3) * 4,
            );
            expect(result.frames.at(-1)).toBe(result.vertices.length / 3);
        },
    );

    test('short moves, fixed-angle travel and rapid moves use the same centerline', () => {
        const short = visualize('G21 G90\nG0 X0 Y10 Z5 A0\nG1 A30\nG1 Y20', {
            rotaryPreviewAxis: 'Y',
        });
        expectPoint(short.vertices.slice(-3), [
            -2.5,
            20,
            (5 * Math.sqrt(3)) / 2,
        ]);
        const rapid = visualize('G21 G90\nG0 X0 Y10 Z5 A0\nG0 A90\nG0 Y20', {
            rotaryPreviewAxis: 'Y',
        });
        expectPoint(rapid.vertices.slice(-6), [-5, 10, 0, -5, 20, 0]);
        expect(
            Array.from(new Float32Array(rapid.colorArrayBuffer)).slice(-8),
        ).toEqual([1, 1, 1, 0.5, 1, 1, 1, 0.5]);
    });

    test('default X behavior and signed transverse offsets are retained', () => {
        const code = 'G21 G90\nG0 X7 Y3 Z4 A0\nG1 A90';
        const original = visualize(code);
        expect(original.vertices).toEqual(
            visualize(code, { rotaryPreviewAxis: 'X' }).vertices,
        );
        expectPoint(original.vertices.slice(-3), [7, 4, -3]);
        expectPoint(
            visualize(code, { rotaryPreviewAxis: 'Y' }).vertices.slice(-3),
            [-4, 3, 7],
        );
    });

    test('incremental and inch inputs produce the same millimeter geometry', () => {
        const options = { rotaryPreviewAxis: 'Y' };
        const metric = visualize(
            'G21 G90\nG0 X0 Y25.4 Z12.7 A0\nG1 Y50.8 A90',
            options,
        );
        const inches = visualize(
            'G20 G90\nG0 X0 Y1 Z0.5 A0\nG91\nG1 Y1 A90',
            options,
        );
        expect(inches.vertices).toEqual(metric.vertices);
    });

    test('SVG projection includes large rotations and matches the 3D XY coordinates', () => {
        const result = visualize('G21 G90\nG0 X0 Y10 Z5 A0\nG1 Y20 A90', {
            rotaryPreviewAxis: 'Y',
            shouldIncludeSVG: true,
        });
        const cutPath = result.paths.find((path) => path.motion === 'G1');
        expect(cutPath).toBeDefined();
        const xy = cutPath.path.slice(1).split(',').filter(Boolean).map(Number);
        const expected = result.vertices.slice(6).filter((_, i) => i % 3 !== 2);
        expect(xy).toHaveLength(expected.length);
        xy.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 5));
    });

    test('optional diameter offset allows Y axial travel and ignores comment axis words', () => {
        const options = {
            rotaryPreviewAxis: 'Y',
            rotaryDiameterOffsetEnabled: true,
        };
        const code =
            '(Cylinder Dia: 10)\n(X99) ; X100\nG21 G90\nG0 Y10 Z0 A0\nG1 Y20 A90';
        expectPoint(visualize(code, options).vertices.slice(-3), [-5, 20, 0]);
        // Preserve the existing guard when a transverse coordinate is present.
        expectPoint(
            visualize(
                code.replace('G0 Y10', 'G0 X0 Y10'),
                options,
            ).vertices.slice(-3),
            [0, 20, 0],
        );
    });

    test('alignment does not change parsed machine bounds or time estimates', () => {
        const code = 'G21 G90\nG0 X0 Y10 Z5 A0\nG1 Y20 A90 F600';
        expect(visualize(code, { rotaryPreviewAxis: 'Y' }).info).toEqual(
            visualize(code).info,
        );
        expect(
            visualize(code, {
                rotaryPreviewAxis: 'Y',
                needsVisualization: false,
            }).vertices,
        ).toEqual([]);
    });

    test('ordinary XYZ files are unchanged', () => {
        const code = 'G21 G90\nG0 X1 Y2 Z3\nG1 X4 Y5 Z6 F600\nG2 X8 Y5 I2 J0';
        expect(visualize(code, { rotaryPreviewAxis: 'Y' }).vertices).toEqual(
            visualize(code).vertices,
        );
    });
});
