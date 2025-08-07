class GbrlHalLineParserResultSDCard {
    static parse(line) {
        // Match the following pattern:
        // [FILE:/Control-Box-test-code.nc|SIZE:66]
        // [FILE:/._Control-Box-test-code.nc|SIZE:4096]
        // [FILE:/SLB-o-christmas-tree.nc|SIZE:5580]
        const r = line.match(/\[FILE:\/([^|]+)\|SIZE:(\d+)\]/gm);

        if (!r) {
            return null;
        }

        // Extract FILE and SIZE from the match
        const fileMatch = r[0].match(/\[FILE:\/([^|]+)\|SIZE:(\d+)\]/);
        const name = fileMatch ? fileMatch[1] : '';
        const size = fileMatch ? parseInt(fileMatch[2], 10) : 0;

        const payload = {
            name,
            size
        };

        return {
            type: GbrlHalLineParserResultSDCard,
            payload: payload
        };
    }
}

export default GbrlHalLineParserResultSDCard;
