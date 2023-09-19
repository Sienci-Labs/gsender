export const GCODE_TRANSLATION_TYPE = {
    DEFAULT: 'DEFAULT',
    TO_METRIC: 'TO_METRIC',
    TO_IMPERIAL: 'TO_IMPERIAL',
};

const replaceHandler = ({ from, to, type }) => ((data) => {
    const [, value] = data.split(from.toUpperCase());
    const valueAsNumber = parseFloat(value);

    const outputValue = ({
        [GCODE_TRANSLATION_TYPE.DEFAULT]: valueAsNumber,
        [GCODE_TRANSLATION_TYPE.TO_IMPERIAL]: valueAsNumber / 25.4,
        [GCODE_TRANSLATION_TYPE.TO_METRIC]: valueAsNumber * 25.4,
    }[type]).toFixed(3);

    const updatedMovement = `${to}${outputValue}`;

    return updatedMovement;
});

// Function to update gcode axes letters and values from a given string
// @params gcode: string containing gcode
// @params from: letter to replace in string
// @params to: letter to change the replacement to
// @params regex: Regular expression to use within String.replace or String.replaceAll
// @params type: Used for updating the gcode numerical value
export const translateGcode = ({
    gcode,
    from,
    to,
    regex,
    type = GCODE_TRANSLATION_TYPE.DEFAULT,
}) => {
    if (!gcode) {
        return '';
    }
    if (!from || !to || !regex) {
        console.error('Missing from, to, and/or regex values');
        return gcode;
    }

    const updatedGcode = gcode.replace(regex, replaceHandler({ from, to, type }));

    return updatedGcode;
};
