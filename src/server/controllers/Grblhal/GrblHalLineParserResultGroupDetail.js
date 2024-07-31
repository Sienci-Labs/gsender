// [SETTINGGROUP:0|0|Root]
// [SETTINGGROUP:1|0|General]
// [SETTINGGROUP:2|0|Control signals]
// [SETTINGGROUP:3|0|Limits]
// [SETTINGGROUP:5|0|Coolant]

const relabels = {
    'Stepper': 'Motors',
    'Stepper driver': 'Motors',
    'Safety Door': 'Door',
    'Aux ports': 'Aux IO',
    'Networking': 'Network',
    'Control signals': 'General',
    'Homing': 'Location',
    'Limits': 'Location',
    'Jogging': 'Location'
};

class GrblHalLineParserResultGroupDetail {
    static parse(line) {
        const r = line.match(/^\[SETTINGGROUP:(\d+)\|(\d+)\|(.*)]$/);
        if (!r) {
            return null;
        }

        const payload = {
            group: Number(r[1]),
            parent: Number(r[2]),
            label: r[3]
        };

        // Handle lookup for manual relabels of specific categories
        if (Object.hasOwn(relabels, payload.label)) {
            payload.label = relabels[payload.label];
        }

        return {
            type: GrblHalLineParserResultGroupDetail,
            payload
        };
    }
}

export default GrblHalLineParserResultGroupDetail;
