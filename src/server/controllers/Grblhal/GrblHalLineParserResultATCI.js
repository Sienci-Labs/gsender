class GrblHalLineParserResultATCI {
    static parse(line) {
        //const r = line.match(/\[(MSG:(?:Error: )?ATCI):?(\d*)?\|(.*)]$/);
        const r = line.match(/\[(MSG:(?:(?:Error:|Warning:)\s)?ATCI):?(\d*)?\|?(.*)]$/);
        if (!r) {
            return null;
        }

        let message = null;
        let description = null;
        const subtype = r[2] || null;
        const valueString = r[3] || '';
        let valueArray = valueString.split('|');

        // Pop title and message off values if subtype exists indicating a dialog
        if (subtype) {
            message = valueArray.shift();
            description = valueArray.shift();
        }

        const values = {};

        valueArray.forEach((param) => {
            let parts = param.split(':');
            values[parts[0]] = parts[1] || null;
        });

        // Mark abort cases with a flag that can be used on the client side
        // Clear if not error in line - so cleared on next message
        if (line.includes('Error:')) {
            values.macro_abort = 1;
        } else {
            values.macro_abort = 0;
        }

        const payload = {
            message,
            subtype,
            description,
            values
        };

        //  Keepout specific logic - how to handle
        if (r[0].includes('inside the keepout zone')) {
            payload.subtype = 10;
            payload.description = r[3].trim();
        }

        return {
            type: GrblHalLineParserResultATCI,
            payload
        };
    }
}

export default GrblHalLineParserResultATCI;
