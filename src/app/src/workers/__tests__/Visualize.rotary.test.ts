import '../Visualize.worker';
import { augmentWorkerGeometry } from 'app/features/Visualizer/workerGeometry';

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
        vertices: result.chunks.flatMap((c) =>
            Array.from(new Float32Array(c.positions, 0, c.vertexCount * 3)),
        ),
        attrs: result.chunks.flatMap((c) =>
            Array.from(new Uint8Array(c.attrs, 0, c.vertexCount)),
        ),
        prefix: Array.from(new Uint32Array(result.prefixEndVertex)),
    };
}
function point(actual: number[], expected: number[]) {
    expected.forEach((value, i) => expect(actual[i]).toBeCloseTo(value, 4));
}
const options = { rotaryPreviewAxis: 'Y', rotaryCenterlineZ: -10 };

describe('RotatoCAM rotary segments-v1 preview', () => {
    test.each([0, 90, -90, 180, 270, 360, 720])(
        'indexed Y alignment at A=%s',
        (a) => {
            const code = `G21 G90\nG0 X3 Y10 Z-2 A${a}\nG1 Y20 F600`;
            const r = visualize(code, options);
            const angle = (a * Math.PI) / 180;
            point(r.vertices.slice(-3), [
                3 * Math.cos(angle) - 8 * Math.sin(angle),
                20,
                3 * Math.sin(angle) + 8 * Math.cos(angle) - 10,
            ]);
            expect(r.rotary).toEqual({ axis: 'Y', centerlineZ: -10 });
            expect(r.attrs).toHaveLength(r.vertices.length / 3);
            expect(r.prefix[r.prefix.length - 1]).toBe(r.totalVertices);
            // Display transforms must not alter machine-space extents/estimates.
            expect(r.info).toEqual(visualize(code).info);
        },
    );
    test.each([0.0005, 2, 90, -90, 720])(
        'simultaneous Y/A motion %s preserves axial travel',
        (a) => {
            const r = visualize(
                `G21 G90\nG0 Y10 Z-5 A0\nG1 Y30 A${a} F600`,
                options,
            );
            const n = Math.max(1, Math.ceil(Math.abs(a) / 5));
            const points = r.vertices.slice(6);
            expect(points).toHaveLength(n * 6);
            for (let i = 0; i < n; i++)
                for (let j = 0; j < 2; j++) {
                    const t = (i + j) / n,
                        angle = (a * t * Math.PI) / 180;
                    point(points.slice(i * 6 + j * 3), [
                        -5 * Math.sin(angle),
                        10 + 20 * t,
                        5 * Math.cos(angle) - 10,
                    ]);
                }
        },
    );
    test.each([10, 0, -10, 3.25])(
        'posted offset %s overrides manual and diameter',
        (offset) => {
            const r = visualize(
                `; rotatocam-meta: z_zero_offset=${offset} radial=z units=mm\n(Cylinder Dia: 100)\nG21 G90\nG0 Y20 Z${8 - offset} A90`,
                { ...options, rotaryDiameterOffsetEnabled: true },
            );
            expect(r.rotary.centerlineZ).toBe(offset === 0 ? 0 : -offset);
            point(r.vertices.slice(-3), [-8, 20, -offset]);
        },
    );
    test('parenthesized metadata stays metric in inch programs and resets per file', () => {
        const r = visualize(
            '(rotatocam-meta: z_zero_offset=25.4 radial=z units=mm)\nG20 G90\nG0 Y1 Z-0.5 A90',
            { rotaryPreviewAxis: 'Y' },
        );
        point(r.vertices.slice(-3), [-12.7, 25.4, -25.4]);
        expect(visualize('G0 X1 A0').rotary).toEqual({
            axis: 'X',
            centerlineZ: 0,
        });
    });
    test.each([
        'z_zero_offset=NaN radial=z units=mm',
        'z_zero_offset=1e999 radial=z units=mm',
        'z_zero_offset=10bad radial=z units=mm',
        'z_zero_offset=10 radial=x units=mm',
        'z_zero_offset=10 radial=z units=inch',
        'z_zero_offset=10 radial=z',
        'z_zero_offset=10 z_zero_offset=20 radial=z units=mm',
        'z_zero_offset=10 radial=z units=mm\n; rotatocam-meta: z_zero_offset=20 radial=z units=mm',
    ])('invalid metadata falls back: %s', (fields) => {
        const r = visualize(
            `; rotatocam-meta: ${fields}\nG21 G90\nG0 Y20 Z-2 A90`,
            options,
        );
        point(r.vertices.slice(-3), [-8, 20, -10]);
    });
    test('XYZ files ignore metadata and A in comments', () => {
        const code = 'G21 G90\nG0 X3 Y4 Z5\nG1 Z-2 ; A90';
        const r = visualize(
            `; rotatocam-meta: z_zero_offset=10 radial=z units=mm\n${code}`,
            options,
        );
        expect(r.vertices).toEqual(visualize(code).vertices);
        expect(r.rotary.centerlineZ).toBe(0);
    });
    test('default X preview and diameter heuristic remain compatible', () => {
        const r = visualize('G21 G90\nG0 X20 Z8 A90');
        point(r.vertices.slice(-3), [20, 8, 0]);
        const y = visualize('(Cylinder Dia: 20)\nG21 G90\nG0 Y20 Z-2 A90', {
            rotaryPreviewAxis: 'Y',
            rotaryDiameterOffsetEnabled: true,
        });
        point(y.vertices.slice(-3), [-8, 20, 0]);
    });
    test('rapid flags and pendant SVG use the same projection', () => {
        const code = 'G21 G90\nG0 Y20 Z-2 A90';
        const r = visualize(code, options);
        expect(r.attrs.every((v) => (v & 0x80) !== 0)).toBe(true);
        const svg = visualize(code, {
            ...options,
            svgOnly: true,
            rapidOpacity: 0.25,
        });
        expect(svg.totalVertices).toBe(0);
        expect(svg.svgSegmentGroups[0].opacity).toBe(0.25);
        const group = svg.svgSegmentGroups[0];
        point(
            Array.from(
                new Float32Array(group.positionsBuffer, 0, group.positionsLen),
            ).slice(-2),
            [-8, 20],
        );
    });
    test('disabled visualization emits no geometry', () => {
        expect(
            visualize('G0 Y20 Z8 A90', {
                ...options,
                needsVisualization: false,
            }).totalVertices,
        ).toBe(0);
    });
    test('viewer adapter preserves metadata and buffer identity', () => {
        const r = visualize('G0 Y20 Z-2 A90', options);
        const adapted = augmentWorkerGeometry(r);
        expect(adapted.rotary).toBe(r.rotary);
        expect(adapted.chunks[0].positions).toBe(r.chunks[0].positions);
    });
});
