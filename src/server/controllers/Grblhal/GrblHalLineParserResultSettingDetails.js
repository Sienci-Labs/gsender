class GrblHalLineParserResultSettingDetails {
    static parse(line) {
        // Match header line and return null - we don't want to parse it.
        const h = line.match(/"\$-Code"/);
        const r = line.match(/(\d*)\t(.*)/);

        if (h || !r) {
            return null;
        }

        const data = r[2].split('\t');

        const payload = {
            id: Number(r[1]),
            unitString: data[1],
            details: data[4]
        };

        return {
            type: GrblHalLineParserResultSettingDetails,
            payload
        };
    }
}

export default GrblHalLineParserResultSettingDetails;
