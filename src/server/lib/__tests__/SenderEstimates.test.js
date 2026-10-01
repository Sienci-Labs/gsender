// See the note in GrblHalAxsProbe.test.js for why this uses require().
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const Sender = require('../Sender').default;

const load = (data) => {
    const sender = new Sender();
    sender.setEstimateData(data);
    return sender;
};

describe('Sender.setEstimateData', () => {
    it('accepts a legacy number[] for lineTime', () => {
        const sender = load({ lineTime: [1, 2.5] });
        expect(Array.from(sender.lineTime)).toEqual([1, 2.5]);
        expect(sender.state.estimatedTime).toBe(3.5);
    });

    it('accepts typed arrays', () => {
        const sender = load({
            lineTime: new Float32Array([0.25, 3]),
            lineKind: new Uint8Array([1, 2]),
        });
        expect(Array.from(sender.lineTime)).toEqual([0.25, 3]);
        expect(Array.from(sender.lineKind)).toEqual([1, 2]);
    });

    it('decodes the Buffers socket.io delivers for typed arrays', () => {
        const sender = load({
            lineTime: Buffer.from(new Float32Array([0.5, 0, 12.25]).buffer),
            lineKind: Buffer.from(new Uint8Array([1, 0, 3]).buffer),
        });
        expect(Array.from(sender.lineTime)).toEqual([0.5, 0, 12.25]);
        expect(Array.from(sender.lineKind)).toEqual([1, 0, 3]);
    });

    it('handles a Buffer that is not 4-byte aligned in its pool', () => {
        const sent = new Float32Array([1.5, 2.5]);
        const pool = Buffer.alloc(sent.byteLength + 1);
        Buffer.from(sent.buffer).copy(pool, 1);
        const sender = load({ lineTime: pool.subarray(1) });
        expect(Array.from(sender.lineTime)).toEqual([1.5, 2.5]);
    });

    it('decodes bare ArrayBuffers', () => {
        const sender = load({ lineTime: new Float32Array([4, 8]).buffer });
        expect(Array.from(sender.lineTime)).toEqual([4, 8]);
    });

    it('pads a missing or short lineKind to the lineTime length', () => {
        const sender = load({
            lineTime: new Float32Array([1, 2, 3]),
            lineKind: new Uint8Array([2]),
        });
        expect(Array.from(sender.lineKind)).toEqual([2, 0, 0]);
        expect(load({ lineTime: [1, 2] }).lineKind.length).toBe(2);
    });

    it('prefers the supplied estimatedTime over the line sum', () => {
        const sender = load({ lineTime: [1, 2], estimatedTime: 10 });
        expect(sender.state.estimatedTime).toBe(10);
    });

    it('falls back to empty for anything else', () => {
        expect(load({ lineTime: 'nope' }).lineTime.length).toBe(0);
        expect(load(undefined).lineTime.length).toBe(0);
    });
});
