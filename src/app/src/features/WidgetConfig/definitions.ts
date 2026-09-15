export interface WidgetContext {
    widgetId: string;
    actions: {
        get: (key: string, defaultValue: any) => void;
        set: (key: string, value: any) => boolean;
        unset: (key: string) => object;
        replace: (key: string, value: any) => object;
    };
}
