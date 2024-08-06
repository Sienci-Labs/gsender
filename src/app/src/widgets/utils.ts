export const translateKey = (key: string, id: string) => {
    const widgetId = id;
    if (typeof key !== 'undefined') {
        key = `widgets["${widgetId}"].${key}`;
    } else {
        key = `widgets["${widgetId}"]`;
    }
    return key;
};
