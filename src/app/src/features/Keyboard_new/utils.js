import shuttleEvents from 'app/lib/shuttleEvents';
import { MACRO_CATEGORY } from 'app/constants';

const allShuttleControlEvents = shuttleEvents.allShuttleControlEvents;

export const AVAILABILITY_TYPES = {
    DEFAULT: 'DEFAULT',
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
    IS_THE_SAME: 'IS_THE_SAME',
};

export const generateList = (shortcuts) => {
    if (!shortcuts) {
        return [];
    }
    let shortcutsList = [];

    Object.keys(shortcuts).forEach((key) => {
        shortcutsList.push(shortcuts[key]);
    });

    shortcutsList.sort((a, b) => {
        let categoryA = MACRO_CATEGORY;
        let categoryB = MACRO_CATEGORY;
        if (allShuttleControlEvents[a.cmd]) {
            categoryA =
                allShuttleControlEvents[a.cmd].category || MACRO_CATEGORY;
        }
        if (allShuttleControlEvents[b.cmd]) {
            categoryB =
                allShuttleControlEvents[b.cmd].category || MACRO_CATEGORY;
        }
        return categoryA.localeCompare(categoryB);
    });

    return shortcutsList;
};
