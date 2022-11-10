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
    console.log(`${quotient} + ${remainder}`);

    if (difference > 0) {
        console.log('positive');
        commandQueue.push(
            ...Array.from({ length: quotient }).fill(majorIncrease),
            ...Array.from({ length: remainder }).fill(minorIncrease)
        );
    } else {
        console.log('Negative');
        commandQueue.push(
            ...Array.from({ length: quotient }).fill(majorDecrease),
            ...Array.from({ length: remainder }).fill(minorDecrease)
        );
    }
    console.log(commandQueue);

    // Space out realtime commands by 50ms intervals
    commandQueue.forEach((command, index) => {
        setTimeout(() => {
            context.write(command);
        }, 50 * (index + 1));
    });
};

/*export const runOverride_old = (context, overridePercentage, type) => {
    switch (type) {
    case 'spindle':
        if (overridePercentage > 0) { // increase override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(overridePercentage / 10);
            let rem = overridePercentage % 10;
            // run 1% increase
            for (let count = 0; count < rem; count++) {
                setTimeout(() => {
                    context.write('\x9C');
                }, 50);
            }
            // run 10% increase
            for (let count = 0; count < quo; count++) {
                setTimeout(() => {
                    context.write('\x9A');
                }, 50);
            }
        } else if (overridePercentage < 0) { // decrease override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(Math.abs(overridePercentage) / 10);
            let rem = Math.abs(overridePercentage) % 10;

            // run decrease 1%
            for (let count = 0; count < rem; count++) {
                setTimeout(() => {
                    context.write('\x9D');
                }, 50);
            }

            //run decrease 10%
            for (let count = 0; count < quo; count++) {
                setTimeout(() => {
                    context.write('\x9B');
                }, 50);
            }
        }
        break;

    case 'feed':
        if (overridePercentage > 0) { // increase override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(overridePercentage / 10);
            let rem = overridePercentage % 10;
            // run 1% increase
            for (let count = 0; count < rem; count++) {
                setTimeout(() => {
                    context.write('\x93');
                }, 50);
            }
            // run 10% increase
            for (let count = 0; count < quo; count++) {
                setTimeout(() => {
                    context.write('\x91');
                }, 50);
            }
        } else if (overridePercentage < 0) { // decrease override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(Math.abs(overridePercentage) / 10);
            let rem = Math.abs(overridePercentage) % 10;

            // run decrease 1%
            for (let count = 0; count < rem; count++) {
                setTimeout(() => {
                    context.write('\x94');
                }, 50);
            }

            //run decrease 10%
            for (let count = 0; count < quo; count++) {
                setTimeout(() => {
                    context.write('\x92');
                }, 50);
            }
        }
        break;

    default:
        return '';
    }
    return '';
};
*/
