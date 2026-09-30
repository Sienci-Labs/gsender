// See the note in GrblHalAxsProbe.test.js for why this uses require().
process.env.GSENDER_LOG_LEVEL = process.env.GSENDER_LOG_LEVEL || 'error';

const { toEstimateArray } = require('../Sender');
const Sender = require('../Sender').default;

describe('toEstimateArray', () => {
    it('passes arrays and Float32Arrays through', () => {
        const plain = [1, 2.5];
        const typed = new Float32Array([0.25, 3]);
        expect(toEstimateArray(plain)).toBe(plain);
        expect(toEstimateArray(typed)).toBe(typed);
    });

    it('decodes the Buffer socket.io delivers for a Float32Array', () => {
        const sent = new Float32Array([0.5, 0, 12.25]);
        const received = Buffer.from(sent.buffer);
        expect(Array.from(toEstimateArray(received))).toEqual([0.5, 0, 12.25]);
    });

    it('handles a Buffer that is not 4-byte aligned in its pool', () => {
        const sent = new Float32Array([1.5, 2.5]);
        const pool = Buffer.alloc(sent.byteLength + 1);
        Buffer.from(sent.buffer).copy(pool, 1);
        expect(Array.from(toEstimateArray(pool.subarray(1)))).toEqual([1.5, 2.5]);
    });

    it('decodes a bare ArrayBuffer', () => {
        const sent = new Float32Array([4, 8]);
        expect(Array.from(toEstimateArray(sent.buffer))).toEqual([4, 8]);
    });

    it('falls back to an empty array for anything else', () => {
        expect(toEstimateArray(undefined)).toEqual([]);
        expect(toEstimateArray('nope')).toEqual([]);
    });
});

describe('Sender.setEstimateData', () => {
    it('stores estimates the countdown can index by line', () => {
        const sender = new Sender();
        sender.setEstimateData(Buffer.from(new Float32Array([2, 3]).buffer));
        expect(sender.state.estimateData.length).toBe(2);
        expect(Number(sender.state.estimateData[1])).toBe(3);
    });
});
