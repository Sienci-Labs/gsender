export const getBitfieldArr = (value) => {
    const arr = Array(16).fill(0);
    // Convert number to base two, flip it reverse it and convert to number to get an array of bits
    let bits = Number(value)
        .toString(2)
        .split('')
        .map(Number)
        .reverse();

    bits.forEach((bit, index) => {
        arr[index] = bit;
    });

    return arr;
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
    return sum;
};
