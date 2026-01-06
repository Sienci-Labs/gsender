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

        const payload = {
            message,
            subtype,
            description,
            values
        };

        //  Keepout specific logic - how to handle
        if (r[0].includes('inside the keepout zone') || r[0].includes('Jog move blocked')) {
            payload.subtype = 10;
            payload.description = r[3].trim();
        }
        console.log(payload);

        return {
            type: GrblHalLineParserResultATCI,
            payload
        };
    }
}

export default GrblHalLineParserResultATCI;
