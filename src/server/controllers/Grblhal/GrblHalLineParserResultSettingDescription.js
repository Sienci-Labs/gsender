/*
[SETTING:341|9|Tool change mode||3|Normal,Manual touch off,Manual touch off @ G59.3,Automatic touch off @ G59.3,Ignore M6|||0|0]
[SETTING:342|9|Tool change probing distance|mm|6|#####0.0|||0|0]
[SETTING:343|9|Tool change locate feed rate|mm/min|6|#####0.0|||0|0]
[SETTING:344|9|Tool change search seek rate|mm/min|6|#####0.0|||0|0]
[SETTING:345|9|Tool change probe pull-off rate|mm/min|6|#####0.0|||0|0]

Format:

[SETTING:<id>|<group id>|<name>|{<unit>}|<data type>|{<format}]|{<min>}|{<max>}]


*/

function formatDataFormat(format) {
    if (format.indexOf(',') > -1) {
        return format.split(',');
    }
    if (format.length === 0) {
        return null;
    }
    return format;
}

class GrblHalLineParserResultSettingDescription {
    static parse(line) {
        const r = line.match(/^\[SETTING:(\d+)(\|)(.+?)(?=])/);

        if (!r) {
            return null;
        }


        const data = r[3].split('|');

        const payload = {
            id: Number(r[1]),
            group: Number(data[0]),
            description: data[1],
            unit: data[2],
            dataType: Number(data[3]),
            format: formatDataFormat(data[4])
        };

        return {
            type: GrblHalLineParserResultSettingDescription,
            payload
        };
    }
}

export default GrblHalLineParserResultSettingDescription;
