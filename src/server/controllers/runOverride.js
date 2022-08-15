// Computes the correct gCode command for slider movements
// @function runOverride
// @param {context} context Parent function context
// @param {number} overridePercentage The amount of percentage increase or decrease.
// @param {string} type The type of override - spindle or feeder
export const runOverride = (context, overridePercentage, type) => {
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
