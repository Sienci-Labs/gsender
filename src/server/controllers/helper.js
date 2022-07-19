export const generateGcode = (pinState, tooltipMoveFactor, sensorPositon) => {
    //Sensor Position: 0-is top right // 1-is top left // 2-bottom right // 3-bottom left
    if ('X' in pinState) {
        return `G0 G21 G91 Y${getDirection(sensorPositon, 'X') * tooltipMoveFactor}`;
    } else if ('Y' in pinState) {
        return `G0 G21 G91 X${getDirection(sensorPositon, 'Y') * tooltipMoveFactor}`;
    } else {
        return `G0 G21 G91 Z-${tooltipMoveFactor}`;
    }
};

function getDirection(sensorPositon, axis) {
    switch (sensorPositon) {
    case 0:
        return -1;
    case 1:
        if (axis === 'X') {
            return -1;
        } else {
            return 1;
        }
    case 2:
        if (axis === 'x') {
            return 1;
        } else {
            return -1;
        }

    case 3:
        return 1;

    default:
        return 0;
    }
}
