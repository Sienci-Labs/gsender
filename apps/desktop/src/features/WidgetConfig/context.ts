import React from 'react';

export const WidgetConfigContext = React.createContext({
    widgetId: '',
    actions: {
        get: (_key: string, _defaultValue?: any): any => {},
        set: (_key: string, _value: any): boolean => {
            return false;
        },
        unset: (_key: string): object => {
            return {};
        },
        replace: (_key: string, _value: any): any => {
            return {};
        },
    },
});
