import GrblHalLineParserResultAXS from '../GrblHalLineParserResultAXS';

const parse = (line) => {
    const result = GrblHalLineParserResultAXS.parse(line);
    return result ? result.payload : null;
};

describe('GrblHalLineParserResultAXS', () => {
    it('parses a normal count:letters report', () => {
        expect(parse('[AXS:3:XYZ]')).toEqual({ count: 3, axes: ['X', 'Y', 'Z'] });
        expect(parse('[AXS:6:XYZABC]')).toEqual({
            count: 6,
            axes: ['X', 'Y', 'Z', 'A', 'B', 'C']
        });
    });

    it('preserves non-conventional axis letters and ordering', () => {
        // grblHAL can be built with arbitrary axis letters, so the letters must be
        // taken verbatim rather than assumed to be XYZABC.
        expect(parse('[AXS:4:XYZC]')).toEqual({
            count: 4,
            axes: ['X', 'Y', 'Z', 'C']
        });
        expect(parse('[AXS:3:ZYX]')).toEqual({ count: 3, axes: ['Z', 'Y', 'X'] });
    });

    it('normalises letters to uppercase', () => {
        expect(parse('[AXS:3:xyz]')).toEqual({ count: 3, axes: ['X', 'Y', 'Z'] });
    });

    it('trusts the letters over a disagreeing count', () => {
        expect(parse('[AXS:3:XY]')).toEqual({ count: 2, axes: ['X', 'Y'] });
    });

    it('accepts a bare count with no letters instead of throwing', () => {
        // Regression: this used to throw a TypeError out of the serial data
        // handler, since nothing on that path is wrapped in a try/catch.
        expect(() => parse('[AXS:4]')).not.toThrow();
        expect(parse('[AXS:4]')).toEqual({ count: 4, axes: [] });
    });

    it('returns null for lines it cannot use, so they fall through', () => {
        expect(parse('[AXS:]')).toBeNull();
        expect(parse('[AXS:abc]')).toBeNull();
        expect(parse('[VER:1.1f.20230131:]')).toBeNull();
        expect(parse('ok')).toBeNull();
    });
});
