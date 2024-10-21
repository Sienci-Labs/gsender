import React, { useContext } from 'react';
import { WidgetConfigContext } from './context';
import { translateKey } from './utils';
import WidgetConfig from './WidgetConfig';

export const WidgetConfigProvider = ({
    widgetId,
    children,
}: {
    widgetId: string;
    children: React.ReactElement;
}) => {
    const config = new WidgetConfig(widgetId);

    const get = (key: string, defaultValue: any): void =>
        config.get(key, defaultValue);
    const set = (key: string, value: any): boolean =>
        config.set(translateKey(key, widgetId), value);
    const unset = (key: string): object =>
        config.unset(translateKey(key, widgetId));
    const replace = (key: string, value: any): object =>
        config.replace(translateKey(key, widgetId), value);

    const actions = { get, set, unset, replace };

    return (
        <WidgetConfigContext.Provider
            value={{
                widgetId: widgetId,
                actions: actions,
            }}
        >
            {children}
        </WidgetConfigContext.Provider>
    );
};

export const getWidgetConfigContext = () => {
    const context = useContext(WidgetConfigContext);
    if (!context) {
        throw new Error(
            'Context unavailable - make sure this is being used within the widget config context provider',
        );
    }
    return context;
};
