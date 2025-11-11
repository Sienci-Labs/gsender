
// More specific Full report sent on startup
//import _ from 'lodash';

import _ from 'lodash';

class GrblHalLineParserResultCompleteStatus {
    static parse(line) {
        const r = line.match(/^<(Idle|Run|Hold|Jog|Alarm|Door|Check|Home|Sleep|Tool)(:\d*)?\|(.*\|FW:grblHAL)(.*)?>$/);
        if (!r) {
            return null;
        }

        const state = r[1];
        let subState = r[2] || '';
        subState = subState.replace(':', '');

        const payload = {};
        const result = {};

        // Separate parameters and store them in results, further split by comma for sub values
        {
            r[3].split('|').forEach((param) => {
                let parts = param.split(':');
                result[parts[0]] = parts[1].split(',') || null;
            });
        }
        {
            // Active state (Idle, Jog, etc) and substate (mostly alarm/door)
            payload.activeState = state;
            payload.subState = subState || '';
        }

        console.log(r);
        console.log(result);

        // Machine Position (v0.9, v1.1)
        if (_.has(result, 'MPos')) {
            const axes = ['x', 'y', 'z', 'a', 'b', 'c'];
            const mPos = _.get(result, 'MPos', ['0.000', '0.000', '0.000']); // Defaults to [x, y, z]
            payload.mpos = {};
            for (let i = 0; i < mPos.length; ++i) {
                payload.mpos[axes[i]] = mPos[i];
            }
        }

        // Work Position (v0.9, v1.1)
        if (_.has(result, 'WPos')) {
            const axes = ['x', 'y', 'z', 'a', 'b', 'c'];
            const wPos = _.get(result, 'WPos', ['0.000', '0.000', '0.000']); // Defaults to [x, y, z]
            payload.wpos = {};
            for (let i = 0; i < wPos.length; ++i) {
                payload.wpos[axes[i]] = wPos[i];
            }
        }

        // Work Coordinate Offset (v1.1)
        if (_.has(result, 'WCO')) {
            const axes = ['x', 'y', 'z', 'a', 'b', 'c'];
            const wco = _.get(result, 'WCO', ['0.000', '0.000', '0.000']); // Defaults to [x, y, z]
            payload.wco = {};
            for (let i = 0; i < wco.length; ++i) {
                payload.wco[axes[i]] = wco[i];
            }
        }

        // Input Pin State (v1.1)
        // * Pn:XYZPDHRS indicates which input pins Grbl has detected as 'triggered'.
        // * Each letter of XYZPDHRS denotes a particular 'triggered' input pin.
        //   - X Y Z XYZ limit pins, respectively
        //   - P the probe pin.
        //   - D H R S the door, hold, soft-reset, and cycle-start pins, respectively.
        //   - Example: Pn:PZ indicates the probe and z-limit pins are 'triggered'.
        //   - Note: A may be added in later versions for an A-axis limit pin.
        if (_.has(result, 'Pn')) {
            const pins = _.get(result, 'Pn[0]', '');
            payload.pinState = {};
            pins.split('').forEach(pin => {
                payload.pinState[pin] = true;
            });
        }

        // Current Tool
        if (_.has(result, 'T')) {
            // Handle updating current tool
            payload.currentTool = Number(result.T[0]);
        }

        // Has Homed
        if (_.has(result, 'H')) {
            payload.hasHomed = Boolean(Number(result.H[0]));
            // handle hasHomed
        }

        // SD Card
        if (_.has(result, 'SD')) {
            payload.sdCard = Boolean(Number(result.SD[0]));
        }


        return {
            type: GrblHalLineParserResultCompleteStatus,
            payload
        };
    }
}

export default GrblHalLineParserResultCompleteStatus;
