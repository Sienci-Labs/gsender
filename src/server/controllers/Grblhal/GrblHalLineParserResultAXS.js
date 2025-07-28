class GrblHalLineParserResultAXS {
    static parse(line) {
        const r = line.match(/^\[(?:AXS:)(.+)\]$/);
        if (!r) {
            return null;
        }

        console.log(r);

        const axisInformation = r[1].split(':');

        const axisCount = Number(axisInformation[0]);
        const axes = axisInformation[1].split('');

        const payload = {
            count: axisCount,
            axes: axes
        };

        return {
            type: GrblHalLineParserResultAXS,
            payload
        };
    }
}

export default GrblHalLineParserResultAXS;
