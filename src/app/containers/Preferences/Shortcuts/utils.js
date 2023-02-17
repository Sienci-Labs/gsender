export const AVAILABILITY_TYPES = {
    DEFAULT: 'DEFAULT',
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    IS_THE_SAME: 'IS_THE_SAME',
};

export const generateList = (shortcuts) => {
    let shortcutsList = [];
    Object.keys(shortcuts).forEach(key => {
        shortcutsList.push(shortcuts[key]);
    });
    shortcutsList.sort((a, b) => {
        return a.category.localeCompare(b.category);
    });
    return shortcutsList;
};
