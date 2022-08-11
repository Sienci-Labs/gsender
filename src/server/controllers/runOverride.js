export const runOverride = (context, overridePercentage, type) => {
    switch (type) {
    case 'spindle':
        // if 100, set to default
        if (overridePercentage === 0) {
            context.write('\x99');
        }
        // else, check for increase or decrease
        if (overridePercentage > 0) { // increase override
            if (overridePercentage === 10) {
                context.write('\0x9A');
            } else if (overridePercentage > 10) {
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
            } else {
                for (let count = 0; count < overridePercentage; count++) {
                    context.write('\0x9C');
                }
            }
        } else if (overridePercentage < 0) { // decrease override
            if (overridePercentage === -10) {
                context.write('\0x9B');
            } else if (overridePercentage < -10) {
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
            } else {
                for (let count = 0; count < Math.abs(overridePercentage); count++) {
                    context.write('\0x9D');
                }
            }
        }
        break;

    case 'feed':
        // if 100, set to default
        if (overridePercentage === 0) {
            context.write('\x90');
        }
        // else, check for increase or decrease
        if (overridePercentage > 0) { // increase override
            if (overridePercentage === 10) {
                context.write('\0x91');
            } else if (overridePercentage > 10) {
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
            } else {
                for (let count = 0; count < overridePercentage; count++) {
                    context.write('\0x93');
                }
            }
        } else if (overridePercentage < 0) { // decrease override
            if (overridePercentage === -10) {
                context.write('\0x92');
            } else if (overridePercentage < -10) {
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
            } else {
                for (let count = 0; count < Math.abs(overridePercentage); count++) {
                    context.write('\0x94');
                }
            }
        }
        break;

    default:
        return '';
    }
    return '';
};
