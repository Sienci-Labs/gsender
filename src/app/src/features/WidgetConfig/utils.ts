export const translateKey = (key: string, id: string) => {
    const widgetId = id;
    if (key.length !== 0) {
        key = `widgets["${widgetId}"].${key}`;
    } else {
        key = `widgets["${widgetId}"]`;
    }
    return key;
};
