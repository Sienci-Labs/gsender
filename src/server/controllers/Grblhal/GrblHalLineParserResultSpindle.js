class GrblHalLineParserResultSpindle {
    static parse(line) {
        const r = line.match(/^(\d+)( - )(.+?)?$/);

        if (!r) {
            return null;
        }

        const payload = {};

        payload.order = Number(r[1]); // Order reported from firmware

        const parts = r[3].split(',');

        payload.label = parts[0];

        // We have more info, we can assume some of it - this will be easier with $spindleESH report
        if (parts.length > 1) {
            payload.id = Number(parts[1].slice(-1)); // Last value is ID to use, convert to number
            payload.capabilities = parts[2].trim(); // Capabilities string
            if (parts[4]) {
                payload.enabled = true;
            }
        }

        return {
            type: GrblHalLineParserResultSpindle,
            payload
        };
    }
}

export default GrblHalLineParserResultSpindle;
