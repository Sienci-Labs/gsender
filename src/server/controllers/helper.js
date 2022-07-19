export const generateGcode = (pinState, tooltipMoveFactor, sensorPositon) => {
    switch (sensorPositon) {
    //Sensor Position: 0-is top right // 1-is top left // 2-bottom right // 3-bottom left
    case 0:
        // sensor corner - top right
        if ('X' in pinState) {
            return `G0 Y-${tooltipMoveFactor}`;
        } else if ('Y' in pinState) {
            return `G0 X-${tooltipMoveFactor}`;
        } else {
            return `G0 Z-${tooltipMoveFactor}`;
        }
    case 1:
        // sensor corner - top left
        if ('X' in pinState) {
            return `G0 Y-${tooltipMoveFactor}`;
        } else if ('Y' in pinState) {
            return `G0 X${tooltipMoveFactor}`;
        } else {
            return `G0 Z-${tooltipMoveFactor}`;
        }
    case 2:
        // sensor corner - bottom right
        if ('X' in pinState) {
            return `G0 Y${tooltipMoveFactor}`;
        } else if ('Y' in pinState) {
            return `G0 X-${tooltipMoveFactor}`;
        } else {
            return `G0 Z-${tooltipMoveFactor}`;
        }
    case 3:
        // sensor corner - bottom left
        if ('X' in pinState) {
            return `G0 Y${tooltipMoveFactor}`;
        } else if ('Y' in pinState) {
            return `G0 X${tooltipMoveFactor}`;
        } else {
            return `G0 Z-${tooltipMoveFactor}`;
        }
    default:
        return true;
    }
};
