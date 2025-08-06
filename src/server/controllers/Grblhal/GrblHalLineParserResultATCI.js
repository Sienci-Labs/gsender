class GrblHalLineParserResultATCI {
    static parse(line) {
        const r = line.match(/^\[(MSG:ATCI):?(\d*)?\|(.*)]$/);
        if (!r) {
            return null;
        }

        console.log(r);

        let message = null;
        let description = null;
        const subtype = r[2] || null;
        const valueString = r[3] || '';
        let valueArray = valueString.split('|');

        // Pop title and message off values if subtype exists indicating a dialog
        if (subtype) {
            console.log(`subtype: ${subtype}`);
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

        return {
            type: GrblHalLineParserResultATCI,
            payload
        };
    }
}

export default GrblHalLineParserResultATCI;
