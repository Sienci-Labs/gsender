class GrblHalLineParserResultAlarmDetails {
    static parse(line) {
        const r = line.match(/^\[ALARMCODE:(\d+)\|\|(.*)]$/);
        if (!r) {
            return null;
        }

        const payload = {};

        return {
            type: GrblHalLineParserResultAlarmDetails,
            payload
        };
    }
}

export default GrblHalLineParserResultAlarmDetails;
