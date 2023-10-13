
// More specific Full report sent on startup
//import _ from 'lodash';

class GrblHalLineParserResultCompleteStatus {
    static parse(line) {
        const r = line.match(/^<(Idle|Run|Hold|Jog|Alarm|Door|Check|Home|Sleep|Tool)(:\d*)?\|(.*\|FW:grblHAL)>$/);
        if (!r) {
            return null;
        }

        console.log(line);
        console.log(r);

        const state = r[1];
        const substate = r[2];

        const payload = {};
        const results = {};

        // Separate parameters and store them in results, further split by comma for sub values
        {
            r[3].split('|').forEach((param) => {
                let parts = param.split(':');
                results[parts[0]] = parts[1].split(',') || null;
            });
        }

        console.log(results);

        {
            // Active state (Idle, Jog, etc) and substate (mostly alarm/door)
            payload.activeState = state;
            payload.substate = substate || '';
        }

        return {
            type: GrblHalLineParserResultCompleteStatus,
            payload
        };
    }
}

export default GrblHalLineParserResultCompleteStatus;
