class GrblHalLineParserResultATCI {
    static parse(line) {
        const r = line.match(/^\[(MSG:ATCI):?(\d*)?\|(.*)]$/);
        if (!r) {
            return null;
        }

        let message = null;
        let description = null;
        const subtype = r[1] || null;
        const valueString = r[2] || '';
        let valueArray = valueString.split('|');

        // Pop title and message off values if subtype exists indicating a dialog
        if (Number(subtype) >= 0) {
            message = valueArray.shift();
            description = valueArray.shift();
        }

        const values = {};

        valueArray.forEach((param) => {
            let parts = param.split(':');
            values[parts[0]] = parts[1].split(',') || null;
        });

        const payload = {
            message,
            subtype,
            description,
            values
        };

        return {
            type: GrblHalLineParserResultATCI,
            payload
        };
    }
}

export default GrblHalLineParserResultATCI;
