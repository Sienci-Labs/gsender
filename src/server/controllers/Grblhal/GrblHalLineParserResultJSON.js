class GrblHalLineParserResultJSON {
    static parse(line) {
        // {...} json line
        const r = line.match(/^({.*})$/);
        if (!r) {
            return null;
        }

        const payload = {
            code: r[1]
        };

        return {
            type: GrblHalLineParserResultJSON,
            payload: payload
        };
    }
}

export default GrblHalLineParserResultJSON;
