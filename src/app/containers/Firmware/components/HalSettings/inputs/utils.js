export const getBitfieldArr = (value) => {
    return Number(value)
        .toString(2)
        .split('')
        .map(Number)
        .reverse();
};

export const convertBitfieldToValue = (bitMap) => {
    let bitValue = 1;
    let sum = 0;

    bitMap.forEach(value => {
        value = value || 0;
        if (value === 1) {
            sum += bitValue;
        }
        bitValue *= 2;
    });
    console.log(sum);
    return sum;
};
