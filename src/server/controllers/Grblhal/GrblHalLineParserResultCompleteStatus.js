
// More specific Full report sent on startup
class GrblHalLineParserResultCompleteStatus {
    static parse(line) {
        const r = line.match(/^<(Idle|Run|Hold|Jog|Alarm|Door|Check|Home|Sleep|Tool)(:\d*)?\|(.*\|FW:grblHAL)>$/);
        if (!r) {
            return null;
        }

        console.log(line);
        console.log(r);

        const payload = {};
        //const result = {};

        return {
            type: GrblHalLineParserResultCompleteStatus,
            payload
        };
    }
}

export default GrblHalLineParserResultCompleteStatus;
