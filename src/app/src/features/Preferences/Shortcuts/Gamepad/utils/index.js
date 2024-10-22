export const arrayComparator = (parentArr, childArr) =>
    childArr.every((element) => parentArr.includes(element));
