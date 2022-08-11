export const runOverride = (context, overridePercentage, type) => {
    switch (type) {
    case 'spindle':
        // if 100, set to default
        if (overridePercentage === 0) {
            context.write('\x99');
        } else if (overridePercentage > 0) { // increase override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(overridePercentage / 10);
            let rem = overridePercentage % 10;
            // run 1% increase
            for (let count = 0; count < rem; count++) {
                context.write('\0x9C');
            }
            // run 10% increase
            for (let count = 0; count < quo; count++) {
                context.write('\0x9A');
            }
        } else if (overridePercentage < 0) { // decrease override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(Math.abs(overridePercentage) / 10);
            let rem = Math.abs(overridePercentage) % 10;

            // run decrease 1%
            for (let count = 0; count < rem; count++) {
                context.write('\0x9D');
            }

            //run decrease 10%
            for (let count = 0; count < quo; count++) {
                context.write('\0x9B');
            }
        }
        break;

    case 'feed':
        // if 100, set to default
        if (overridePercentage === 0) {
            context.write('\x90');
        } else if (overridePercentage > 0) { // increase override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(overridePercentage / 10);
            let rem = overridePercentage % 10;
            // run 1% increase
            for (let count = 0; count < rem; count++) {
                context.write('\0x93');
            }
            // run 10% increase
            for (let count = 0; count < quo; count++) {
                context.write('\0x91');
            }
        } else if (overridePercentage < 0) { // decrease override
            // eslint-disable-next-line no-bitwise
            let quo = ~~(Math.abs(overridePercentage) / 10);
            let rem = Math.abs(overridePercentage) % 10;

            // run decrease 1%
            for (let count = 0; count < rem; count++) {
                context.write('\0x94');
            }

            //run decrease 10%
            for (let count = 0; count < quo; count++) {
                context.write('\0x92');
            }
        }
        break;

    default:
        return '';
    }
    return '';
};
