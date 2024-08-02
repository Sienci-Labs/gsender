import { useContext } from "react";
import { WidgetConfigContext } from "./context";
import { translateKey } from "./utils";
import store from "../store";

/* 
    to use this, wrap the widget in a provider component like so:
    <WidgetConfigContext.Provider value={widgetId}>
        ...
    <WidgetConfigContext/>
*/

const useWidgetConfig = () => {
    if (!useContext) {
        throw new Error('The useContext hook is not available with your React version');
    }

    const widgetId = useContext(WidgetConfigContext);

    if (!widgetId) {
        throw new Error('useWidgetConfig must be called within WidgetConfigProvider');
    }

    return Object.freeze({
        get: (key: string, defaultValue: any) => store.get(key, defaultValue),
        set: (key: string, value: any) => store.set(translateKey(key, widgetId), value),
        unset: (key: string) => store.unset(translateKey(key, widgetId)),
        update: (key: string, updater: any) => store.update(translateKey(key, widgetId), updater),
    });
};

export default useWidgetConfig;