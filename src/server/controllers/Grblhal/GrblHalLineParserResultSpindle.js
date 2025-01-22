class GrblHalLineParserResultSpindle {
    static parse(line) {
        const r = line.match(/^(\d+)( - )(.+?)?$/);
        // new match for updated spindle data
        const nr = line.match(/\[SPINDLE:(.+?)]/);

        console.log(nr);

        const nr = line.match(/\[SPINDLE:(.+?)]/);

        if (!r && !nr) {
            return null;
        }

        const payload = {};
        // Handle new spindle update early
        /*
            [SPINDLE:0|0|0|*DIRV|PWM|0.0,1000.0]
            ID | Enabled/Num | TYPE | *(is_current) capabilities | Name | RPMMin,RPMMax]
         */
        if (nr) {
            const parts = nr[1].split('|');
            payload.label = parts[4];
            payload.id = Number(parts[0]);
            payload.capabilities = parts[3];
            payload.enabled = payload.capabilities.indexOf('*') > -1;
            payload.laser = payload.capabilities.indexOf('L') > -1;
            payload.capabilities = payload.capabilities.replace('*', ''); // Strip out enabled asterisk
            return {
                type: GrblHalLineParserResultSpindle,
                payload
            };
        }

        payload.order = Number(r[1]); // Order reported from firmware

        const parts = r[3].split(',');

        payload.label = parts[0];

        // We have more info, we can assume some of it - this will be easier with $spindleESH report
        if (parts.length > 1) {
            payload.id = Number(parts[1].slice(-1)); // Last value is ID to use, convert to number
            payload.capabilities = parts[2].trim(); // Capabilities string
            payload.enabled = !!parts[3]; // "Current" text parsed - true if exists, false otherwise
            // Do we have a laser potential
            payload.laser = payload.capabilities.indexOf('L') > -1;
        }

        return {
            type: GrblHalLineParserResultSpindle,
            payload
        };
    }
}

export default GrblHalLineParserResultSpindle;
