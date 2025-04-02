export const arrayComparator = (parentArr, childArr) =>
    childArr.every((element) => parentArr.includes(element));

export const AVAILABILITY_TYPES = {
    DEFAULT: 'DEFAULT',
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    IS_THE_SAME: 'IS_THE_SAME',
};
