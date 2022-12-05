// Computes the correct gCode command for slider movements
// @function runOverride
// @param {context} context Parent function context
// @param {number} overridePercentage The amount of percentage increase or decrease.
// @param {string} type The type of override - spindle or feeder

export const calcOverrides = (context, difference = 100, type = 'feed') => {
    const commandQueue = [];

    if (difference === 0) {
        return;
    }

    const commands = {
        spindle: {
            majorIncrease: '\x9A',
            majorDecrease: '\x9B',
            minorIncrease: '\x9C',
            minorDecrease: '\x9D',
        },
        feed: {
            majorIncrease: '\x91',
            majorDecrease: '\x92',
            minorIncrease: '\x93',
            minorDecrease: '\x94',
        }
    };
    const { majorIncrease, majorDecrease, minorIncrease, minorDecrease } = commands[type];
    // Determine quotient and remainder to determine amount of major and minor commands to send
    const absValue = Math.abs(difference);
    const quotient = Math.floor(absValue / 10);
    const remainder = absValue % 10;

    if (difference > 0) {
        commandQueue.push(
            ...Array.from({ length: quotient }).fill(majorIncrease),
            ...Array.from({ length: remainder }).fill(minorIncrease)
        );
    } else {
        commandQueue.push(
            ...Array.from({ length: quotient }).fill(majorDecrease),
            ...Array.from({ length: remainder }).fill(minorDecrease)
        );
    }

    // Space out realtime commands by 50ms intervals
    commandQueue.forEach((command, index) => {
        setTimeout(() => {
            context.write(command);
        }, 50 * (index + 1));
    });
};
