class GrblHalLineParserResultSpindle {
    static parse(line) {
        const r = line.match(/^(\d+)( - )(.+?)?$/);

        if (!r) {
            return null;
        }

        console.log(r);
        const payload = {};

        payload.order = Number(r[1]); // Order reported from firmware

        const parts = r[3].split(',');

        console.log(parts);

        payload.label = parts[0];

        // We have more info, we can assume some of it - this will be easier with $spindleESH report
        if (parts.length > 1) {
            payload.id = Number(parts[1].slice(-1)); // Last value is ID to use, convert to number
            payload.capabilities = parts[2].trim(); // Capabilities string
            payload.enabled = !!parts[3]; // "Current" text parsed - true if exists, false otherwise
        }

        return {
            type: GrblHalLineParserResultSpindle,
            payload
        };
    }
}

export default GrblHalLineParserResultSpindle;
