import React from 'react';
import noop from 'lodash';

export const WidgetConfigContext = React.createContext({
    widgetId: '',
    actions: {
        get: noop,
        set: noop,
        unset: noop,
        replace: noop
    }
});