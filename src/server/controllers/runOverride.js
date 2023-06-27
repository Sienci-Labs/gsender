// Computes the correct gCode command for slider movements
// @function runOverride
// @param {context} context Parent function context
// @param {number} overridePercentage The amount of percentage increase or decrease.
// @param {string} type The type of override - spindle or feeder

export const calcOverrides = (difference = 100, type = 'feed') => {
    const commandQueue = [];

    if (difference === 0) {
        return commandQueue;
    }

    const commands = {
        spindle: {
            majorIncrease: String.fromCharCode(0x9A),
            majorDecrease: String.fromCharCode(0x9B),
            minorIncrease: String.fromCharCode(0x9C),
            minorDecrease: String.fromCharCode(0x9D),
        },
        feed: {
            majorIncrease: String.fromCharCode(0x91),
            majorDecrease: String.fromCharCode(0x92),
            minorIncrease: String.fromCharCode(0x93),
            minorDecrease: String.fromCharCode(0x94),
        }
    };
    const { majorIncrease, majorDecrease } = commands[type];
    // Determine quotient and remainder to determine amount of major and minor commands to send
    const absValue = Math.abs(difference);
    const quotient = Math.floor(absValue / 10);

    if (difference > 0) {
        commandQueue.push(
            ...Array.from({ length: quotient }).fill(majorIncrease),
        );
    } else {
        commandQueue.push(
            ...Array.from({ length: quotient }).fill(majorDecrease),
        );
    }
    // Space out realtime commands by 50ms intervals
    return commandQueue;
};
