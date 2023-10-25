class GrblHalLineParserResultAlarmDetails {
    static parse(line) {
        const r = line.match(/^\[ALARMCODE:(\d+)\|\|(.*)]$/);
        if (!r) {
            return null;
        }

        const payload = {
            id: Number(r[1]),
            description: r[2]
        };

        return {
            type: GrblHalLineParserResultAlarmDetails,
            payload
        };
    }
}

export default GrblHalLineParserResultAlarmDetails;
